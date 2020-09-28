$(document).ready(function () {
    $('#try-demo').click(function () {
        setupDemo();
    });
        
    $('#darkMode').click(function () {
        const textColor = displayConfigs.config.textColor;
        $('.tagline-component').css({'color': textColor});
        $('#try-demo').css({'color': textColor});
    });
});


function setupDemo() {
    const cookie = requestHeaderManager.getCookie('csrftoken');

    $.ajax({
        type: 'POST',
        url: 'annotate/setup-demo/',
        data: {'csrfmiddlewaretoken': cookie},
        success: function (response) {
            const data = JSON.parse(response);
            const config = data['config'];
            const docs = data['documents'];
            const openType = docs.length <= 1 ? 'single' : 'multiple'

            // Store configurations
            localStorage.setItem('configText', config);
            localStorage.setItem('documentCount', docs.length);
            localStorage.setItem('documentOpenType', openType);

            // Store doc texts and file types
            for (let i = 0; i < docsCount; i++) {
                localStorage.setItem('fileName' + i, 'demo-document-' + i);
                localStorage.setItem('documentText' + i, docs[i]);
                localStorage.setItem('lineBreakType' + i, getLineBreakType(docs[i]));
            }

            // Move to annotation page
            location.href = '/annotate';
        }
    });
}

function getLineBreakType(text) {
    if (text.indexOf('\r\n') !== -1) {
        return 'windows';
    } else if (text.indexOf('\r') !== -1) {
        return 'mac';
    } else if (text.indexOf('\n') !== -1) {
        return 'linux';
    }
    return 'unknown';
}
