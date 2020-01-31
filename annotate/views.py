import json
import pickle
import random
import requests
import stringdist
import numpy as np

from django.http import HttpResponse
from django.shortcuts import render

from modAL.models import ActiveLearner
from modAL.uncertainty import uncertainty_sampling

from nltk import sent_tokenize
from nltk import word_tokenize
from nltk import ngrams

from os import listdir
from os.path import isfile, join, splitext

from simstring.feature_extractor.character_ngram import (
    CharacterNgramFeatureExtractor)
from simstring.database.dict import DictDatabase
from simstring.measure.cosine import CosineMeasure
from simstring.searcher import Searcher

from sklearn.metrics import accuracy_score
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_extraction.text import CountVectorizer


def annotate_data(request):
    return render(request, 'annotate/annotate.html', {})


def suggest_cui(request):
    """
    Returns all relevant UMLS matches that have a cosine similarity
    value over the specified threshold, in descending order
    """
    global searcher
    if searcher is None:
        return HttpResponse('')

    selected_term = request.GET['selectedTerm']

    # Weight relevant UMLS matches based on word ordering
    weighted_outputs = {}
    for umls_match in searcher.ranked_search(selected_term, COSINE_THRESHOLD):
        umls_term = umls_match[1]
        # Add divsor to each term
        weighted_outputs[umls_term + ' :: UMLS ' + term_to_cui[umls_term] + '***'] = stringdist.levenshtein(umls_term, selected_term)

    # Sort order matches will be displayed based on weights
    output = [i[0] for i in sorted(weighted_outputs.items(), key=lambda kv: kv[1])]

    # Remove divisor from final term
    if output != []:
        output[-1] = output[-1][:-3]

    return HttpResponse(output)


def setup_dictionary(request):
    """
    Setup user-specified dictionary to be used for
    phrase approximation
    """
    dictionary_selection = request.POST['dictionarySelection']
    global term_to_cui
    global searcher
    if dictionary_selection == 'umlsDictionary':
        # searcher = umls_searcher
        pass
    elif dictionary_selection == 'noDictionary':
        # searcher = None
        pass
    elif dictionary_selection == 'userDictionary':
        json_data = json.loads(request.POST['dictionaryData'])
        db = DictDatabase(CharacterNgramFeatureExtractor(2))
        term_to_cui = {}
        for row in json_data:
            values = row.split('\t')
            if len(values) == 2:
                term_to_cui[values[1]] = values[0]
        for value in term_to_cui.keys():
            value = clean_dictionary_term(value)
            db.add(value)
        searcher = Searcher(db, CosineMeasure())
    return HttpResponse(None)


def clean_dictionary_term(value):
    return value.lower()


'''
def auto_annotate(request):
    doc_text = request.GET['document_text']

    doc_ngrams = []
    for sentence in sent_tokenize(doc_text):
        tokens = sentence.split()
        token_count = len(tokens)
        if token_count > 2:
            token_count = 3

        for n in range(2, token_count):
            for ngram in ngrams(tokens, n):
                term = ' '.join(list(ngram))
                if term not in doc_ngrams:
                    doc_ngrams.append(term)

    raw_sentence_ngrams = []
    clean_sentence_ngrams = []
    for raw_ngram in doc_ngrams:
        if not raw_ngram[-1].isalnum():
            raw_ngram = raw_ngram[:-1]
        else:
            continue

        clean_ngram = ''
        for char in raw_ngram:
            if char.isalnum():
                clean_ngram += char.lower()
            else:
                clean_ngram += ' '
        clean_ngram = ' '.join([word for word in clean_ngram.split()])
        if clean_ngram is not '':
            raw_sentence_ngrams.append(raw_ngram)
            clean_sentence_ngrams.append(clean_ngram)

    final_results = []
    for i in range(len(raw_sentence_ngrams)):
        result = searcher.ranked_search(raw_sentence_ngrams[i].lower(),
                                        COSINE_THRESHOLD + 0.2)
        if result == []:
            continue
        else:
            final_results.append([raw_sentence_ngrams[i]] + [result[0][1]] +
                                 [term_to_cui[result[0][1]]])

    return HttpResponse(json.dumps(final_results))


def load_user_dictionary(request, data_file_path):
    try:
        chosen_file = gui.PopupGetFile('Choose a file', no_window=True)
    except:
        return HttpResponse(None)

    # Read in tab-delimited UMLS file in form of (CUI/tTERM)
    user_dict = open(chosen_file).read().split('\n')

    # Split tab-delimited UMLS file into seperate lists of cuis and terms
    cui_list = []
    term_list = []

    for row in user_dict:
        data = row.split('\t')
        if len(data) > 1:
            cui_list.append(data[0])
            term_list.append(data[1])

    global term_to_cui
    global db
    global searcher

    # Map cleaned UMLS term to its original
    term_to_cui = dict()

    for i in range(len(term_list)):
        term_to_cui[term_list[i]] = cui_list[i]

    # Create simstring model
    db = DictDatabase(CharacterNgramFeatureExtractor(2))

    for term in term_list:
        db.add(term)

    searcher = Searcher(db, CosineMeasure())
    return HttpResponse(None)

'''


# Get all annotated texts from ann_files (positive samples)
def get_annotated_texts(ann_files):
    annotated = set()
    for ann_file in ann_files:
        annotations = ann_file.split('\n')
        for annotation in annotations:
            if len(annotation) > 0 and annotation[0] == 'T':
                raw_annotation_text = annotation.split('\t')[-1]
                # MOST ANNOTATION SPACES PROBABLY HAVEN'T BEEN REPLACED WITH '_'
                annotated.add(' '.join(raw_annotation_text.split('_')).lower().strip())
    return annotated


# Get all unannotated texts from txt_files (negative samples)
def get_unannotated_texts(txt_files, annotated):
    unannotated = set()
    for txt_file in txt_files:
        sentences = txt_file.split('\n')
        for sentence in sentences:
            # NGRAM RANGE IS LIMITED TO 4
            for n in range(5):
                for ngram in ngrams(sentence.split(' '), n):
                    term = ' '.join(ngram).lower().strip()
                    if term not in annotated:
                        unannotated.add(term)
    return unannotated


# Get training data
def get_training_data(txt_files, ann_files, custom_dict=None):
    # Get all annotated texts from ann_files (positive samples)
    annotated = get_annotated_texts(ann_files)

    '''
    # Get all annotated texts from custom_dict (positive samples)
    for term in custom_dict:
        annotated.add(term)
    '''

    unannotated = get_unannotated_texts(txt_files, annotated)

    # These are split to make them equal length -- CHANGE OR LIMIT TO CERTAIN NUMBER OF SAMPLES --
    annotated_count = len(list(annotated))
    X = list(annotated) + list(unannotated)[:annotated_count]
    y = [1 for _ in range(annotated_count)] + [0 for _ in range(annotated_count)]

    return X, y


# Encode training data
def encode_data(X, y=None):
    global vectorizer
    X = vectorizer.fit_transform(X).toarray()
    
    if y is None:
        return np.array(X)
    
    # Shuffle all data - MAY NOT BE NESECESSARY IF ONLY USED FOR TRAINING
    Xy = list(zip(X, y))
    random.shuffle(Xy)
    X, y = zip(*Xy)

    return np.array(X), np.array(y)


# Initialise learner
def initialise_active_learner(request):
    txt_files = request.POST.get('txtFiles')
    ann_files = request.POST.get('annFiles')
    # custom_dict = request.POST.get('customDict')

    X_train, y_train = get_training_data([txt_files], [ann_files])
    X_train, y_train = encode_data(X_train, y_train)

    # Initialise the learner - CHANGE NUMBER OF ESTIMATORS, THE CLASSIFIER, THE QUERY STRATERGY, ETC.
    global learner
    learner = ActiveLearner(
        estimator=RandomForestClassifier(n_estimators=100),
        query_strategy=uncertainty_sampling,
        X_training=X_train, y_training=y_train
    )

    return HttpResponse(None)


def get_annotation_suggestions(request):
    txt_file = request.POST.get('txtFile')
    current_annotations = get_annotated_texts([request.POST.get('currentAnnotations')])

    ngrams = get_ngram_data(txt_file)

    global vectorizer
    X = vectorizer.transform(ngrams)

    predicted_labels = predict_labels(X)
    predicted_terms = []
    ngrams = list(ngrams)
    for i in range(len(predicted_labels)):
        if predicted_labels[i] == 1:
            if ngrams[i] not in current_annotations:
                predicted_terms.append(ngrams[i])
            # else learn (existing annotations)
    predicted_terms.append(ngrams[query_data(X)[0]])

    return HttpResponse(predicted_terms)


# Get all possible ngrams from letter currently being annotated
def get_ngram_data(txt_file):
    potential_annotations = set()

    sentences = txt_file.split('\n')
    for sentence in sentences:
        # NGRAM RANGE IS LIMITED TO 4
        for n in range(5):
            for ngram in ngrams(sentence.split(' '), n):
                potential_annotations.add(' '.join(ngram).lower().strip())
    
    return potential_annotations


# Query n-gram data (have a category for unsure to help improve & category of confident labels)
def query_active_learner(request):
    query_idx, query_instance = learner.query(X)
    return HttpResponse({'id': query_idx, 'instance': query_instance})


def teach_active_learner(request):
    instance = request.POST.get('instance')
    label = request.POST.get('label')
    learner.teach(instance, label)
    return HttpResponse(None)


# Predict labels for n-gram data
def predict_labels(X):
    return learner.predict(X)


# Acceptance or rejection made
def suggestion_feedback():
    learner.teach("encoded text", "label")


# Non-suggested annotation made
def annotation_added():
    learner.teach("encoded text", 1)


# Refresh suggestions (each time a acceptance, rejection or non-suggested annotation added)
def refresh_suggestions():
    pass



vectorizer = CountVectorizer()
learner = None
COSINE_THRESHOLD = 0.7

TEST = True

if TEST:
    term_to_cui = None
    db = None
    searcher = None
else:
    term_to_cui = pickle.load(open('term_to_cui.pickle', 'rb'))
    db = pickle.load(open('db.pickle', 'rb'))
    searcher = Searcher(db, CosineMeasure())