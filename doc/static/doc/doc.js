$(document).ready(function () {
    $('#darkMode').click(function () {
        let textColor = displayConfigs.config.textColor;
        $('.doc-message').css({'color': textColor});
        $('.doc-link').css({'color': textColor});
    });
});