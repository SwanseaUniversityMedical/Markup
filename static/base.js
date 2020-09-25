const SessionManager = {
    newSession() {
        this.clearLocalStorage();
        this.resetOntology();
    },

    clearLocalStorage() {
        // Clear all non-display storage
        if (window.location.href.indexOf('annotate') == -1) {
            const displayMode = localStorage.getItem('mode');
            localStorage.clear();
            if (displayMode) {
                localStorage.setItem('mode', displayMode);
            }
        }
    },

    resetOntology() {
        $.ajax({
            type: 'POST',
            url: '/reset-ontology'
        });
    }
}

const requestHeaderManager = {
    setRequestHeader() {
        const csrftoken = this.getCookie('csrftoken');

        $.ajaxSetup({
            beforeSend: function(xhr, settings) {
                const isSafeMethod = (/^(GET|HEAD|OPTIONS|TRACE)$/.test(settings.type));
                if (!isSafeMethod && !this.crossDomain) {
                    xhr.setRequestHeader("X-CSRFToken", csrftoken);
                }
            }
        });
    },

    getCookie(name) {
        let cookieValue;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    },
}

requestHeaderManager.setRequestHeader();

SessionManager.newSession();
