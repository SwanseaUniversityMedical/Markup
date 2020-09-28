$(document).ready(function () {
    $('#darkMode').click(function () {
        const textColor = displayConfigs.config.textColor;
        const backgroundColor = displayConfigs.config.backgroundColor;
    
        $('.option-container').css({
            'color': textColor,
            'background-color': backgroundColor,
        });
    });

    $('#add-entity').click(function () {
        const entity = $('#entity-name').val().trim();

        if (inputValidator.isValidEntity(entity)) {
            // Hide empty message and display output list
            $('#empty-container-message').hide();
            $('#output-list-container').show();

            // Add entity to output list
            entityList.push(entity + '\n');

            // Add entity to display list
            $('#entity-list').append('<span class="added-element" name="entity" style="background-color: ' + colors.pop() + ';">' + entity + '</span>');
            
            updateBlobUrl();
            bindEvents();
        }
        // Reset input form
        $('#entity-name').val('');
    });


    $('#add-attribute').click(function () {
        /*
        Enable input and adding of attribute
        which is displayed in output list
        */
        const name = $('#attribute-name').val().trim();
        const relation = $('#attribute-relation').val().trim();
        const dropdown = $('#attribute-dropdown').val().split(',');

        // Construct formatted attribute string
        let attribute = name + ' ' + 'Arg:' + relation + ', Value:';
        for (let i = 0; i < dropdown.length; i++) {
            if (i != dropdown.length - 1) {
                attribute += dropdown[i].trim() + "|";
            } else {
                attribute += dropdown[i].trim();
            }
        }

        if (attribute) {
            // Validate related entities
            if (entityList.indexOf(relation + '\n') == -1) {
                alert('You need to add the related entity before using it in an attribute.');
                return;
            }

            // Hide empty message and display output lists
            $('#empty-container-message').hide();
            $('#output-list-container').show();

            // Add constructed attribute to output list
            attributeList.push(attribute + '\n');

            // Add attribute to display list
            let entityColor = getEntityColor($(this).text());
            $('#attribute-list').html(
                '<span class="added-element" attribute-for="' + relation + '" style="background-color: ' + entityColor + ';">' +
                    attribute +
                '</span>'
            );
        
            updateBlobUrl();
            bindEvents();
        }
        // Reset input forms
        $('#attribute-name').val('');
        $('#attribute-relation').val('');
        $('#attribute-dropdown').val('');
    });


    function updateBlobUrl() {
        let saveButton = document.getElementById('save-configuration-file');
        let blob = new Blob(entityList.concat(attributeList), {type: 'text/plain'});
        window.URL.revokeObjectURL(saveButton.href);
        saveButton.href = URL.createObjectURL(blob);
        saveButton.download = 'annotation.conf';
    }


    function bindEvents() {
        /*
        Enable added elements to
        be deleted upon selection
        */
        $('.added-element').click(function () {
            const text = $(this).text() + '\n';

            // Remove element from output list
            const listType = $(this).parent().attr('id');
            if (listType == 'entity-list') {
                // Make entity color available again
                colors.push($(this).css('background-color'));

                // Remove from entity list
                for (let i = 0; i < entityList.length; i++) {
                    if (entityList[i] == text) {
                        entityList.splice(i, 1);
                        break;
                    }
                }

                // Remove all attributes that relate to selected entity
                let i = attributeList.length - 1;
                while (i > 0) {
                    if (attributeList[i] != '[attributes]\n') {
                        const attributeComponent = attributeList[i].split('Arg:')[1];
                        const relatedEntity = attributeComponent.split(', Value:')[0] + '\n';
                        if (relatedEntity == text) {
                            attributeList.splice(i, 1);
                        }
                    }
                    i--;
                }

                // Remove related attributes from display
                $('span[attribute-for=' + text + ']').each(function () {
                    $(this).remove();
                });
            } else if (listType == 'attribute-list') {
                // Remove from attribute list
                for (let i = 0; i < attributeList.length; i++) {
                    if (attributeList[i] == text) {
                        attributeList.splice(i, 1);
                        break;
                    }
                }
            }
            // Remove from display list
            $(this).remove();

            // Show empty container list is valid
            if (entityList.length == 1 && attributeList.length == 1) {
                $('#empty-container-message').show();
                $('#output-list-container').hide();
            }
            updateBlobUrl();
        });
    }

    // Add tooltips to option headlines
    $('.config-tooltip').simpletooltip({
        position: 'right',
        border_color: 'white',
        color: '#1A1E24',
        background_color: 'white',
        border_width: 4
    });
});

const inputValidator = {
    isValidEntity(entity) {
        return entity != '' && !entityList.includes(entity + '\n')
    }
}


function getEntityColor(name) {
    $('span[name="entity"]').each(function () {
        if ($(this).text() == relation) {
            return $(this).css('background-color');
        }
    });
}


// Initalize entity and attribute lists with default headers
let entityList = ['[entities]\n'];
let attributeList = ['[attributes]\n'];

// Colors to be used for entities and attributes in output list
let colors = [
    '#C0C0C0', '#4169E1', '#FFF0F5', '#FFFACD', '#E6E6FA', '#B22222', '#C71585',
    '#32CD32', '#48D1CC', '#FF6347', '#FFA500', '#FF69B4', '#008B8B', '#00BFFF',
    '#E0CCA4', '#ADD8D1', '#8FE3B4', '#FFC0CB', '#FFA07A', '#7B68EE', '#FFD700'
];
