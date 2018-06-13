var map;
var retData; // Parsed data retrieved from forms
var markers = {};
var validToCreate;
var row;
var trackTotalErrors = [];

$(document).ready(function() {
    
    initVis();

    /* Drop markers representing all contacts */
    $.get('/retContacts', function (data) 
    {       
        retData = JSON.parse(data);
            
        $(retData).each(function (key, value) 
        {
        var toolTipInformation = "<h5>" + value['first']+ " " + value['last']+ "</h5>" + value['street'] + ", " + value ['city'] +", " +  value['state'] + ", " + value['zip'];
            dropMarker({lat:value['latitude'], lng: value['longitude']}, toolTipInformation, value['_id']);
        });
    });
    
    /* If contents of table are clicked center map on that row with users info */
    $('#tableContents').on('click','tr', function () 
    {
        map.setCenter({lat: $(this).data('latitude'), lng: $(this).data('longitude')});        
    });
    
    /* Check if update button was clicked on contacts page and act accordingly */
    $('#tableContents').on('click','.modify', function() 
    {
        validToCreate = false;
    
        /* Generate form first, then pre-populate elements */
        createForm();
        
        /* AJAX call to server to retrieve ID */
        row = $(this).parent().parent();
        
        /* Get row data of button pressed */
        var info = $.post('/givenContact', {id: row.data('id')});
        info.done(function (result) {
            retData = JSON.parse(result);
            
            /* Prepend data with the suffix */
            var suffix = retData.suffix;
            if (suffix === "Mr") $('#suffix1').prop('checked', true);
            else if (suffix === "Mrs") $('#suffix2').prop('checked', true);
            else if (suffix === "Ms") $('#suffix3').prop('checked', true);
            else $('#suffix4').prop('checked', true);
            
            $('#first').val(retData.first);
            $('#last').val(retData.last);
            $('#street').val(retData.street);
            $('#city').val(retData.city);
            $('#state').val(retData.state);
            $('#zip').val(retData.zip);
            $('#phone').val(retData.phone);
            $('#email').val(retData.email);
            
            /* Contact type column of table */
            if (retData.contactByEmail && retData.contactByMail && retData.contactByPhone)
            { 
                $('#allGood').prop('checked',true);
            }       
            else 
            {
                if (retData.contactByMail) 
                {
                    $('#mailGood').prop('checked',true);
                }
                if (retData.contactByPhone) 
                {
                    $('#phoneGood').prop('checked',true);
                }
                if (retData.contactByEmail) 
                {
                    $('#onlineGood').prop('checked',true);
                }
            }
            
        });
        
        /* Provide animation for contacts SPA on create button click */
        $('html, body').animate({
            scrollTop: $( '#createContact' ).offset().top
        }, 500);
    });
    
    /* If button pressed is delete, delete the data in the respective row */
    $('#tableContents').on('click', '.delete', function () 
    {
        var row = $(this).parent().parent();
        
        var info = $.post('/removeContact', {id: row.data('id')});
        info.done(function (result) 
        {
            /* Update table on page */
            deleteMarker(row.data('id'));
            row.remove();
        });
    });
    
    /* Render a new form for creating a new database entry when create is clicked */    
    $('#createButton').on('click',function() 
    {
        createForm();
        
        validToCreate = true;
        resetValues();
    });
    
    /* Validate the form information upon submission */
    $('#createForm').validate({
        errorPlacement: function(error, element) 
        {
           trackTotalErrors.push(error);
        },
        /* Set rules for validating required form info */
        rules: {
            suffix: "required",
            first: "required",
            last:"required",
            street: "required",
            city:"required",
            state:"required",
            zip: {
                minlength: 5,
                number: true,
                required: true,
            },
            phone: {
                maxlength: 10,
                minlength: 10,
                number: true
            }
            
        },
        messages: {
            suffix: "Please enter the suffix!",
            first: "Please enter your first name!",
            last: "Please enter your last name!",
            street: "Please enter the street address!",
            city: "Please enter the city!",
            state: "Please enter the state!",
            zip: "Please enter the zip code of the location!",
            phone: "Please enter a valid phone number!"
        }
       
    });
    
 
    $('#createForm').on('click','#save', function() 
    {
        /* Clear the error list, remove errors from UL in html */
        trackTotalErrors.length = 0;
        $('li').remove();
        
        if ($('#createForm').valid() )
        {
            var data = getFormDataObj('createForm');
            
            if(validToCreate) 
            {
                /* Include info in database */
                var info = $.post('/spaSubmit', data);

                /* Add data from form submission to table on contacts page */
                info.done(function (result) 
                {
                    retData = JSON.parse(result);
                    retData.id = retData._id;
                    generateNewRow(retData);
                });
            }
            else 
            {
                data.id = row.data('id');

                var info = $.post('/update', data);

                info.done(function (result) 
                {
                    /* Modify existing data in database */
                    retData = JSON.parse(result);
                    retData.id = row.data('id');
                    deleteMarker(row.data('id'));
                    row.remove();
    
                    generateNewRow(retData);
                });
            }
            showmailerTY();
            $('#createContact').slideUp();

        }
        /* Display errors if necessary */
        else 
        {          
            for (i=0;i<trackTotalErrors.length;++i) 
            {
                $('<li/>').text(trackTotalErrors[i].html())
                        .appendTo('ul');
                console.log(trackTotalErrors[i].html());
            }
            showErrors();
        }
    });
    
    /* Handle click on the close button for the pop up messages */
    $('.close').on('click',function () 
    {
        var parentID = $(this).parent().attr('id');
        if (parentID == 'createContact') 
        {
            resetValues();
            $('#'+parentID).slideUp();
        }
        else if (parentID == 'searchTable') 
        {
            makeTableVisible();
            $('#'+parentID).slideUp();
        }
        else if (parentID === 'errors' || parentID === 'thankYou') 
        {
            $('#'+parentID).slideUp();
        }
    })
    
    /* Enable the search box to appear */
    $("#search").on('click', function () 
    {
        $('#searchTable').slideDown();
    });
    
    $('#searchBox').on('click', '#searchButton', function () 
    {
        var dataToSearch = getFormDataObj('searchBox');
        makeTableVisible();
        searchName(dataToSearch);
    });
});

/*-----------------------------------------------------------*/
/*           Functions used throughout the app               */
/*-----------------------------------------------------------*/

/* unhides hidden table, used with searching contacts by name functionality */
function makeTableVisible() 
{
    rows =$('#tableContents').children();
    $.each(rows, function (index, data) 
    {
        $(this).show();
    })
};

/* Retrieves form object via id */
function getFormDataObj(formId) 
{
    var formObj = {};
    var inputs = $('#'+formId).serializeArray();
    $.each(inputs, function (i, input) 
    {
        formObj[input.name] = input.value; 
    });
    return formObj;
}

/* Search rows of the table for user input(first/last name) */
function searchName(searchData) 
{
    firstname = searchData.firstname.toLowerCase();
    lastname = searchData.lastname.toLowerCase();
    
    rows =$('#tableContents').children();
    $.each(rows, function (index, data) 
    {
        var name = data.children[0].innerHTML;
        var nameParts = name.split(' ');
        
        var first = nameParts[1].toLowerCase();
        var last = nameParts[2].toLowerCase();
        
        if (!firstname && !lastname) $(this).show();
        else if (firstname && lastname)
        {
            if (first.indexOf(firstname) == -1) 
            {
                $(this).hide();
            }
            else if (last.indexOf(lastname) == -1) 
            {
                $(this).hide();
            }
        }
        else if (first.indexOf(firstname) == -1)
        {
            console.log(first +" didnt have "+ firstname);
            $(this).hide();
        }
        else if (last.indexOf(lastname) == -1)
        {
            $(this).hide();
        }
    })
    
}

/* Masking functions used throughout app */
function mask (create, mailerTY, errors) 
{
    create ? $('#createContact').slideDown('slow') : $('#createContact').hide();
    mailerTY ? $('#thankYou').fadeIn() : $('#thankYou').hide();
    errors ? $('#errors').fadeIn() : $('#errors').hide();
}

function initVis() 
{
    mask (false,false, false);
    $("#searchTable").hide();
}

function createForm()
{
    mask(true,false,false);
}

function showmailerTY() 
{
    mask(false,true, false);
}

function showErrors() 
{
    mask (true, false, true);
}

/* Add new row on form submission with associated data */
function generateNewRow(retData) 
{
    var toolTipInformation = "<h4>" + retData.first+ " " 
    + retData.last+ "</h4>" + retData.street + ", " + retData.city 
    +", " +  retData.state + ", " + retData.zip;

    dropMarker({lat:retData.latitude,lng: retData.longitude}, toolTipInformation, retData.id);

    var emailLink = $('<a/>').attr('href','mailto:'+retData.email)
                            .text(retData.email);
    var contactMethod ="";

    /* Set up Contact Method column */
    if(retData.contactByPhone && retData.contactByEmail && retData.contactByMail)
    {
        contactMethod = contactMethod.concat('Any ');
    }
    if (retData.contactByPhone)
    {
        contactMethod = contactMethod.concat('| Phone');
    }
    if (retData.contactByEmail)
    {
        contactMethod = contactMethod.concat('| Email');
    }
    if (retData.contactByMail)
    {
        contactMethod = contactMethod.concat('| Mail');
    }
    
    /* Add all other pertinent information to row */
    var newRow = $('<tr/>');
    $('<td/>').text(retData.suffix + " " +retData.first + " " + retData.last).appendTo(newRow);
    $('<td/>').text(retData.street + ", " + retData.city + ", " + retData.state+ ", " + retData.zip).appendTo(newRow);
    $('<td/>').append(emailLink).appendTo(newRow);
    $('<td/>').text(retData.phone).appendTo(newRow);
    
    newRow.append($('<td/>').append(contactMethod));

    /* Add delete and update buttons */
    newRow.append($('<td/>').append($('<button/>').attr({
        type: 'button',
        class: 'modify btn hvr-sweep-to-bottom',
        name: 'modifyContact',
    })
                        .text('Update')
    ));
    
    newRow.append($('<td/>').append($('<button/>').attr({
        type: 'button',
        class: 'delete btn hvr-sweep-to-bottom',
        name: 'delete',
    })
                        .text('Delete')
    ));
    
    newRow.attr({
        'data-id': retData.id,
        'data-latitude': retData.latitude,
        'data-longitude': retData.longitude,
        'class': 'table-hover'
    })    
    newRow.fadeIn();
    newRow.appendTo('#tableContents');
}

/* Reset form fields to default */
function resetValues() 
{
    /* Negate any suffix selections */
    $('#suffix1').prop('checked', false);
    $('#suffix2').prop('checked', false);
    $('#suffix3').prop('checked', false);
    $('#col4').prop('checked', false);
    /* Reset all other form fields */
    $('#first').val("");
    $('#last').val("");
    $('#street').val("");
    $('#city').val("");
    $('#state').val("");
    $('#zip').val("");
    $('#phone').val("");
    $('#email').val("");
}

/* Initialize the map on the contacts page */
function createMap () 
{
    latlng = {lat:41.08394699999999, lng: -74.176609}; // Centered at Ramapo
    map = new google.maps.Map(document.getElementById('map-canvas'),{
        center: latlng,
        zoom: 8
    });
}

/* Delete markers on the map */
function deleteMarker (id) 
{
    var markerToDelete = markers[id];
    markerToDelete.setMap(null);
}

/* Drop markers on the map from form data stored in databse */
/* Also add functionality for tooltips                      */
function dropMarker(location, locationString, dataID) 
{
    var marker = new google.maps.Marker({
        id: dataID,
        position: location
    });
    markers[dataID] = marker;
    marker.setMap(map);
    
    var toolTip = new google.maps.InfoWindow({
        content: locationString,
        maxWidth: 250
    });

    /* Tooltip Interactivity */
    marker.addListener( 'click', function() 
    {
        toolTip.open(map, marker);
    });
    
    marker.addListener('mouseover', function () 
    {
        toolTip.open(map, marker);
    });
    
    marker.addListener('mouseout', function () 
    {
        toolTip.close(map, marker);
    });
}