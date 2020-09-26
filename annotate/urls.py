from django.conf.urls import url

from . import views

app_name = 'annotate'

urlpatterns = [
    url('setup-demo/',
        views.setup_demo, name='setup_demo'),
    url(r'^setup/~/setup-umls-if-valid$',
        views.setup_umls_if_valid, name='setup_umls_if_valid'),
    url(r'^setup/~/setup-preloaded-ontology$',
        views.setup_preloaded_ontology, name='setup_preloaded_ontology'),
    url(r'^setup/~/setup-custom-ontology$',
        views.setup_custom_ontology, name='setup_custom_ontology'),
    url(r'^reset-ontology$',
        views.reset_ontology, name='reset_ontology'),
    url(r'^$',
        views.annotate_data, name='annotate_data'),
    url(r'^~/suggest-cui$',
        views.suggest_cui, name='suggest_cui'),
    url(r'^~/suggest-annotations$',
        views.suggest_annotations, name='suggest_annotations'),
    url(r'^~/teach-active-learner$',
        views.teach_active_learner, name='teach_active_learner')
]




'''
urlpatterns = [
    url('', views.annotate_data, name='annotate_data'),
    url('suggest-cui/', views.suggest_cui, name='suggest_cui'),
    url('suggest-annotations/', views.suggest_annotations, name='suggest_annotations'),
    url('teach-active-learner/', views.teach_active_learner, name='teach_active_learner'),
    url('reset-ontology/', views.reset_ontology, name='reset_ontology'),
    url('setup-demo/', views.setup_demo, name='setup_demo'),
    url('setup-umls/', views.setup_umls, name='setup_umls'),
    url('setup-preloaded-ontology/', views.setup_preloaded_ontology, name='setup_preloaded_ontology'),
    url('setup-custom-ontology/', views.setup_custom_ontology, name='setup_custom_ontology'),
]
'''