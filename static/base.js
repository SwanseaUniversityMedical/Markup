$(document).ready(function () {
    /* Switch between dark and light display modes */
    $('#darkMode').click(function () {
        if (localStorage.getItem('mode') == 'dark') {
            localStorage.setItem('mode', 'light');
        } else {
            localStorage.setItem('mode', 'dark');
        }
        displayManager.updateDisplay();
    });
});


const displayConfigs = {
    primaryColor: '#33FFB5',

    config : {
        navText: 'Dark Mode',
        backgroundColor: '#f1f1f1',
        backgroundColorAlt: '#1A1E24',
        backgroundColorSim: '#e7e7e7',
        textColor: '#1A1E24'
    },

    updateConfigs() {
        if (localStorage.getItem('mode') == 'dark') {
            this.config.navText = 'Light Mode';
            this.config.backgroundColor = '#1A1E24';
            this.config.backgroundColorAlt = '#f1f1f1';
            this.config.backgroundColorSim = '#31363d';
            this.config.textColor = 'white';
        } else {
            this.config.navText = 'Dark Mode';
            this.config.backgroundColor = '#f1f1f1';
            this.config.backgroundColorAlt = '#1A1E24';
            this.config.backgroundColorSim = '#e7e7e7';
            this.config.textColor = '#1A1E24';
        }
    }
}


const displayManager = {
    updateDisplay() {
        displayConfigs.updateConfigs();
        this.updateStyles();
    },

    updateStyles() {
        const navText = displayConfigs.config.navText;
        const backgroundColor = displayConfigs.config.backgroundColor;
        const textColor = displayConfigs.config.textColor;
        const primaryColor = displayConfigs.primaryColor;

        // Update button in nav
        document.getElementById('darkMode').innerHTML = navText;

        // Update background and text color of page items
        $('nav').css({'background-color': backgroundColor});
        $('.nav-logo').css({'color': textColor});
        $('.nav-item').css({'color': textColor});
        $('.nav-item-arrow').css({'color': primaryColor});
        $('body').css({
            'background-color': backgroundColor,
            'color': textColor
        });
    },
}


const sessionManager = {
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

sessionManager.newSession();

requestHeaderManager.setRequestHeader();
