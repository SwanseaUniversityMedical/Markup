$(document).ready(function () {
    $('#darkMode').click(function () {
        const textColor = displayConfigs.config.textColor;
        $('.doc-message').css({'color': textColor});
        $('.doc-link').css({'color': textColor});
    });
});
