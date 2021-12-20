$('body').on('click', '.btn_id', function (e) {

    let info = [];
    let $row = $(this).closest("tr");
    $tds = $row.find("td");
    $.each($tds, function () {
        info.push($(this).text());
    });
    let lineItemEntriesArray = [];
    let rowidArray = [];
    let name_of_line_itemsArray = [];
    let winnerEmail = info[1];

    $("#lineitemsTable input[type=checkbox]:checked").each(function () {

        let row = $(this).closest("tr")[0];
        let rateDetail = $(this).closest("tr").find(':input[type="text"]').val();
        let lineItemEntries = {
            'line_item_id': row.cells[3].innerHTML,
            'rate': rateDetail,
            'item_id': row.cells[5].innerHTML,
            'name': row.cells[0].innerHTML
        }

        lineItemEntriesArray.push(lineItemEntries);
        rowidArray.push(row.cells[2].innerHTML);
        name_of_line_itemsArray.push(row.cells[0].innerHTML);
    });
    $("#result").text('');
    e.preventDefault();
    $("#result").text('');

    $.ajax({
        type: "POST",
        url: "/server/bookscatalystconnection_function/updatePO",
        contentType: "application/json",
        data: JSON.stringify({
            'vendorid': info[2],
            'poid': info[3],
            'rowid': rowidArray,
            'lineitems': lineItemEntriesArray,
            'linedetailsNames': name_of_line_itemsArray,
            'winnerEmail': winnerEmail
        }),
        success: function (data) {
            let sendToClient = '';
            if (data.length > 0) {

                let createDiv = '<div class="row" style="margin:0;padding:0;"><div class = "col-md">';
                let createTable = '<table class = "table table-striped"><thead colspan = "2" style = "font"> <tr> <th> Mail Vendor ? </th> <th> Vendor Email </th> <th> Contact ID </th><th> PO ID </th><th> PO Number </th><th> Line Items </th></tr></thead> </tbody>';
                let endTable = '</></table>';
                let endofPO = '<tr bgcolor="#BBEDA9"><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>';
                $("#result").text('');
                let endDiv = '</div>';
                let divDetails = '<td><div><table id="lineitemsTable" class="table table-striped"><thead><tr><th>Name</th><th>Rate</th><th>Row ID</th><th>Line Item ID</th><th>Selected</th><th>Item ID</th></tr></thead>';
                let endDivDetails = '</table></div></td>';

                for (i = 0; i < data.length; i++) {
                    let poid = data[i].poid;
                    let ponumber = data[i].ponumber;
                    let contactsid = data[i].contactsid;
                    let contactsemail = data[i].contactsemail;
                    let itemList = data[i].lineitems;
                    let names = itemList[0].name;
                    let rates = itemList[0].rate;
                    let rowid = itemList[0].rowid;
                    let itemid = itemList[0].itemid;
                    let lineitemID = itemList[0].lineitem;
                    let rowInfo = '';
                    let newDiv = '';
                    let divFinal = '';

                    rowInfo = rowInfo + '<tr> <td><input name="sendmail" class="sendmail_id" type="checkbox" value="' + contactsemail + '" id="' + contactsemail + '"></td><td>' + contactsemail + '</td><td>' + contactsid + '</td><td>' + poid + '</td><td>' + ponumber + '</td>';
                    for (m = 0; m < names.length; m++) {
                        newDiv = newDiv + '<tr><td>' + names[m] + '</td><td><input name="rateDetails" class="rateInfo" type="text" value=' + rates[m] + '></input></td><td>' + rowid[m] + '</td><td>' + lineitemID[m] + '</td><td><input name="lineitem" class="chk" type="checkbox" id="' + lineitemID[m] + '"></td><td>' + itemid[m] + '</td>';
                    }
                    divFinal = divDetails + newDiv + endDivDetails;
                    rowInfo = rowInfo + divFinal + '<td><input id="' + contactsid + '" type="button" name="Declare Winner" value="Winner" class="btn_id"></td>';
                    rowInfo = rowInfo + endofPO;
                    sendToClient = sendToClient + createDiv + createTable + rowInfo + endTable + endDiv;
                }

                $('#output').html(sendToClient);
            } else {
                let sendToClient = 'No Auctions to List ';
                $('#output').html(sendToClient);
                $("#result").text('');
            }
        },
        error: function (error) {
            console.log(error);
            alert("Error is " + error);
        }
    });

});


function getPODetailsForAuction() {
    $.ajax({
        url: "/server/bookscatalystconnection_function/getDetails",
        method: 'get',
        success: function (data) {
            let sendToClient = '';
            if (data.length > 0) {
                let createDiv = '<div class="row" style="margin:0;padding:0;"><div class = "col-md">';
                let createTable = '<table class = "table table-striped"><thead colspan = "2" style = "font"> <tr> <th> Mail Vendor ? </th> <th> Vendor Email </th> <th> Contact ID </th><th> PO ID </th><th> PO Number </th><th> Line Items </th></tr></thead> </tbody>';
                let endTable = '</></table>';
                let endofPO = '<tr bgcolor="#BBEDA9"><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>';
                $("#result").text('');
                let endDiv = '</div>';
                let divDetails = '<td><div><table id="lineitemsTable" class="table table-striped"><thead><tr><th>Name</th><th>Rate</th><th>Row ID</th><th>Line Item ID</th><th>Selected</th><th>Item ID</th></tr></thead>';
                let endDivDetails = '</table></div></td>';

                for (i = 0; i < data.length; i++) {
                    let poid = data[i].poid;
                    let ponumber = data[i].ponumber;
                    let contactsid = data[i].contactsid;
                    let contactsemail = data[i].contactsemail;
                    let itemList = data[i].lineitems;
                    let names = itemList[0].name;
                    let rates = itemList[0].rate;
                    let rowid = itemList[0].rowid;
                    let itemid = itemList[0].itemid;

                    let lineitemID = itemList[0].lineitem;
                    let rowInfo = '';


                    let newDiv = '';
                    let divFinal = '';
                    rowInfo = rowInfo + '<tr> <td><input class="chk" name="sendmail" type="checkbox" id="' + contactsemail + '"></td><td>' + contactsemail + '</td><td>' + contactsid + '</td><td>' + poid + '</td><td>' + ponumber + '</td>';
                    for (m = 0; m < names.length; m++) {
                        newDiv = newDiv + '<tr><td class="itemname">' + names[m] + '</td><td><input name="rateDetails" class="rateInfo" type="text" value=' + rates[m] + '></input></td><td>' + rowid[m] + '</td><td>' + lineitemID[m] + '</td><td><input name="lineitem" class="chk" type="checkbox" id="' + lineitemID[m] + '"></td><td>' + itemid[m] + '</td>';
                    }
                    divFinal = divDetails + newDiv + endDivDetails;
                    rowInfo = rowInfo + divFinal + '<td><input id="' + contactsid + '" type="button" name="Declare Winner" value="Winner" class="btn_id"></td>';
                    rowInfo = rowInfo + endofPO;
                    sendToClient = sendToClient + createDiv + createTable + rowInfo + endTable + endDiv;
                }
                $('#output').html(sendToClient);
                var buttonInfo = '<button id="mailButton" class="mailButton">Send Mail</button>';
                $('#buttonInfo').html(buttonInfo);
            } else {
                let sendToClient = 'No Auctions to List ';
                $('#output').html(sendToClient);
                $("#result").text('');
            }
        },
        error: function (error) {
            $("#result").text('');
            console.log(error);
            alert("Error is " + error);
        },
    });
}

$(document).on('click', '.mailButton', function () {
    var info = [];
    var checkedIds = $(".chk:checked").map(function () {
        var $row = $(this).closest("tr");
        $tds = $row.find("td");
        $.each($tds, function () {
            info.push($(this).text());
        });
        return this.id;
    }).toArray();
    $.ajax({
        type: "POST",
        url: "/server/bookscatalystconnection_function/sendEmailsToVendors",
        contentType: "application/json",
        data: JSON.stringify({
            'vendorEmails': checkedIds,
            'ponumber': info[4]
        }),
        success: function () {
            $("#mailingStatus").text('Mail sent to vendors');
        },
        error: function () {
            $("#mailingStatus").text('Issue in sending mail to vendors');
        }
    })
})