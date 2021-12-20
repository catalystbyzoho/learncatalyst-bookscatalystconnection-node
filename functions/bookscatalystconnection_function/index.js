const express = require('express');
const app = express();
const catalyst = require('zcatalyst-sdk-node');
const bodyParser = require('body-parser');
const axios = require('axios');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const from_email = FROM_EMAIL_CONFIGURED_IN_CATALYST_CONSOLE;
const BOOKS_API = 'https://books.zoho.com/api/v3';
const TABLENAME = 'PODetails';

const CREDENTIALS = {
    BooksConnector: {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        auth_url: 'https://accounts.zoho.com/oauth/v2/auth',
        refresh_url: 'https://accounts.zoho.com/oauth/v2/token',
        refresh_token: REFRESH_TOKEN
    }
};

/**
 * Function to store the PO details in the Catalyst database in the PODetails table
 * @param {* id of the vendor } vendorid 
 * @param {* id of the purchase order } poid - 
 * @param {* po number of the purchase order } ponumber - 
 * @param {* array containing line item names like Cow Milk, Buffalo Milk } name - 
 * @param {* array containing the rate at which the line item is offered } rate - 
 * @param {* array containing the  quantity of line item  } qty - 
 * @param {* array containing the  measurement unit like kgs, lbs, kms for the line item } unit - 
 * @param {* array containing the total price for the line item } total - 
 * @param {* array containing emails of the vendors } list_of_vendor_emails - 
 * @param {*  array containing the id of the line item } lineitemid -
 * @param {* array containing the id of the item like Cow Milk, Buffalo Milk } itemid - 
 */
const storePODetails = async (catalystApp, vendorid, poid, ponumber, name, rate, qty, unit, total, list_of_vendor_emails, lineitemid, itemid) => {

    let table = catalystApp.datastore().table(TABLENAME);
    for (const email of list_of_vendor_emails) {
        for (i = 0; i < name.length; i++) {
            await table.insertRow({
                email: email.email,
                contact_id: email.contact_id,
                name: name[i],
                rate: rate[i],
                total: total[i],
                lineitem: lineitemid[i],
                itemid: itemid[i],
                qty: qty[i],
                unit: unit[i],
                vendor_id: vendorid,
                poid: poid,
                ponumber: ponumber
            });
        }
    }
}

/**Gets all the emails of vendors in the system
 * 
 * @param {* The access token } accessToken 
 * @returns list of vendor-emails
 */
const getListOfVendorEmails = async (accessToken, vendorid, poid, ponumber) => {

    try {
        const myData = [];
        let config = {
            method: 'get',
            url: `${BOOKS_API}/contacts?filter_by=Status.Vendors`,
            headers: {
                'Authorization': `Zoho-oauthtoken ${accessToken}`,
                'Content-Type': 'application/json',
            }
        };
        const response = await axios(config);
        if (response.status == 200) {
            const listContacts = response.data.contacts;
            for (const contact of listContacts) {
                myData.push({
                    email: contact.email,
                    contact_id: contact.contact_id,
                    vendor_id: vendorid,
                    poid: poid,
                    ponumber: ponumber
                });
            }
        }
        return myData;
    } catch (e) {
        console.log("Failure. Unable to get the emails of vendors.  ", e);
        return myData;
    }
}

/**
 * @param {* Handle to Catalyst} catalystApp 
 * @param {* poid of the specific Purchase Order to be updated} poid 
 * @returns true if there is any lineItemWinner value as true for the poid across vendors
 */
const checkPOStatus = async (catalystApp, poid) => {

    let zcql = catalystApp.zcql();
    const query = `select lineItemWinner from PODetails where poid= ${poid}`;
    let responses = [];
    let queryResult = await zcql.executeZCQLQuery(query);
    for (const data of queryResult) {
        responses.push(data.PODetails.lineItemWinner);
    }
    return responses.includes(true);
}

/**
 * 
 * @param {* The access token } accessToken 
 * @param {* The purchase order id to be updated } purchase_order_id 
 * @param {* The email which won the auction } chosen_email 
 * @param {* The vendor id } vendor_id
 * @returns {* result of the operation } true/false
 */
const createPO = async (catalystApp, accessToken, vendor_id, purchase_order_id, lineDetails, names, winnerEmail) => {
    let details = lineDetails;
    const itemDetails = [];
    for (const detail of details) {
        itemDetails.push({
            'item_id': detail.item_id,
            'rate': detail.rate,
            'name': detail.name
        });
    }
    try {
        let config = {
            method: 'post',
            url: `${BOOKS_API}/purchaseorders/`,
            data: {
                'vendor_id': vendor_id,
                'contact_persons': [],
                'line_items': itemDetails,

            },
            headers: {
                'Authorization': `Zoho-oauthtoken ${accessToken}`,
                'Content-Type': 'application/json',
                'X-ZOHO-Skip-Webhook-Trigger': 'true'
            }
        };
        await axios(config);
        await updateLineItemWinner_POTable(catalystApp, purchase_order_id, winnerEmail);
        await updatePODetailsTable(catalystApp, purchase_order_id, names);
        return true;
    } catch (e) {
        console.log("Failure in creating PO ", e);
        return false;
    }
}

/**
 * 
 * @param {* The access token } accessToken 
 * @param {* The purchase order id to be updated } purchase_order_id 
 * @param {* The email which won the auction } chosen_email 
 * @param {* The vendor id } vendor_id
 * @returns {* result of the operation } true/false
 */
const updatePO = async (catalystApp, accessToken, vendor_id, purchase_order_id, lineDetails, names, winnerEmail) => {
    try {
        let config = {
            method: 'put',
            url: `${BOOKS_API}/purchaseorders/${purchase_order_id}`,
            data: {
                'vendor_id': vendor_id,
                'contact_persons': [],
                'line_items': lineDetails
            },
            headers: {
                'Authorization': `Zoho-oauthtoken ${accessToken}`,
                'Content-Type': 'application/json',
            }
        };
        await axios(config);
        await updateLineItemWinner_POTable(catalystApp, purchase_order_id, winnerEmail);
        await updatePODetailsTable(catalystApp, purchase_order_id, names);
        return true;
    } catch (e) {
        console.log("Failure ", e);
        return false;
    }
}

/**
 * This is called to update the line items names like Cow Milk etc as that has already been addressed by
 * some vendor. So the entries for that specific line item will not be part of the subsequent auctions
 * @param {* handle to Catalyst } catalystApp 
 * @param {* purchase order id} poid 
 * @param {* array containing names of the line items like Cow Milk, Buffalo Milk etc} names 
 * @returns true
 */
const updatePODetailsTable = async (catalystApp, poid, names) => {
    for (const name of names) {
        let rowids = [];
        let queryResult = await catalystApp.zcql().executeZCQLQuery(`select * from PODetails where poid= ${poid} and name='${name}' and lineItemWinner=false`);
        for (const data of queryResult) {
            rowids.push(data.PODetails.ROWID);
        }
        for (const rowId of rowids) {
            await catalystApp.datastore().table(TABLENAME).updateRow({
                lineItemWinner: true,
                ROWID: rowId
            });
        }
    }
    return true;
}

/**
 * Update all the rows of the winner vendor with lineItemWinner as true so that 
 * it does not participate in any other Auction again for that specific PO
 * @param {* handle to Catalyst} catalystApp 
 * @param {* poid of the purchase order to be updated } poid 
 * @param {* email address of the vendor who has won the deal for the line item} winnerEmail 
 * @returns true/false
 */
const updateLineItemWinner_POTable = async (catalystApp, poid, winnerEmail) => {

    let rowids = [];
    let queryResult = await catalystApp.zcql().executeZCQLQuery(`select * from PODetails where poid= ${poid} and email='${winnerEmail}'`);
    for (const data of queryResult) {
        rowids.push(data.PODetails.ROWID);
    }
    for (const rowId of rowids) {
        await catalystApp.datastore().table(TABLENAME).updateRow({
            lineItemWinner: true,
            ROWID: rowId
        });
    }
    return true;
}

/**Queries the database and sends the POs including the lineitems to the client
 * 
 * @param {*} catalystApp 
 * @returns Info from DB
 */
const getInfoFromDB = async (catalystApp) => {

    let ponumberArray = [];
    let sendInfo = [];
    let queryResult = await catalystApp.zcql().executeZCQLQuery(`select distinct ponumber from PODetails`);
    for (const data of queryResult) {
        ponumberArray.push(data.PODetails.ponumber);
    }

    for (const poNumber of ponumberArray) {
        let emailArray = [];
        let contactidArray = [];
        let queryData = await catalystApp.zcql().executeZCQLQuery(`select distinct email from PODetails where ponumber='${poNumber}'`);
        for (const data of queryData) {
            emailArray.push(data.PODetails.email);
        }
        for (const email of emailArray) {
            let queryResponse = await catalystApp.zcql().executeZCQLQuery(`select distinct contact_id from PODetails where ponumber='${poNumber}' and email='${email}'`);
            contactidArray.push(queryResponse[0].PODetails.contact_id);
        }

        for (const email of emailArray) {

            let lineItemsList = [];
            let total = [];
            let rate = [];
            let lineitem = [];
            let rowid = [];
            let name = [];
            let itemid = [];
            let queryResp = await catalystApp.zcql().executeZCQLQuery(`select itemid, vendor_id, poid, lineitem, rate, total, name, rowid from PODetails where ponumber='${poNumber}' and email='${email}' and lineItemWinner=false`);

            if (queryResp.length != 0) {
                for (const data of queryResp) {
                    total.push(data.PODetails.total);
                    rate.push(data.PODetails.rate);
                    lineitem.push(data.PODetails.lineitem);
                    rowid.push(data.PODetails.ROWID);
                    name.push(data.PODetails.name);
                    itemid.push(data.PODetails.itemid);
                }
                lineItemsList.push({
                    name,
                    rate,
                    lineitem,
                    rowid,
                    total,
                    itemid
                });
                sendInfo.push({
                    ponumber: poNumber,
                    vendorid: queryResp[0].PODetails.vendor_id,
                    poid: queryResp[0].PODetails.poid,
                    contactsemail: email,
                    contactsid: contactidArray[a],
                    lineitems: lineItemsList
                });
            }
        }
    }
    return sendInfo;
}

const sendEmail_with_Data = async (catalystApp, emailArray, ponumber) => {

    let queryResult = await catalystApp.zcql().executeZCQLQuery(`select qty, name, unit from PODetails where ponumber='${ponumber}' and email='${emailArray[0]}'`);
    let content = '';
    for (const data of queryResult) {
        content = content + " - " + data.PODetails.qty + " " + data.PODetails.unit + " of " + data.PODetails.name + " \n ";
    }
    for (const email of emailArray) {
        await catalystApp.email().sendMail({
            from_email,
            to_email: email,
            subject: 'Request for competitive price for items',
            content: "We want to purchase the following and want the best quote from you  \n \n " + content
        });
    }
}

/**
 * This is the function which gets invoked from Books via webhooks
 * Each time a Purchase Order gets created in Books, this gets invoked and
 * all the PO attributes are received here
 * 
 */

app.post('/receiveBooksInfo', async function (req, res) {

    try {
        const catalystApp = catalyst.initialize(req);
        const accessToken = await catalystApp.connection(CREDENTIALS).getConnector('BooksConnector').getAccessToken();
        let r_object = req.body.JSONString;
        let obj = JSON.parse(r_object);
        let line_item_rate = [];
        let line_item_qty = [];
        let line_item_total = [];
        let line_item_unit = [];
        let line_item_name = [];
        let line_item_id = [];
        let item_id = [];
        let vendorid = obj.purchaseorder.vendor_id;
        let poid = obj.purchaseorder.purchaseorder_id;
        let ponumber = obj.purchaseorder.purchaseorder_number;

        let items = obj.purchaseorder.line_items;
        for (i = 0; i < items.length; i++) {
            line_item_rate.push(items[i].rate);
            line_item_qty.push(items[i].quantity);
            line_item_name.push(items[i].name);
            line_item_total.push(items[i].item_total);
            line_item_unit.push(items[i].unit);
            line_item_id.push(items[i].line_item_id);
            item_id.push(items[i].item_id);
        }
        list_of_vendor_emails = await getListOfVendorEmails(accessToken, obj.purchaseorder.vendor_id, obj.purchaseorder.purchaseorder_id, ponumber);

        if (list_of_vendor_emails.length == 0) {
            res.status(200).send({ "status": "success", "message": 'No Vendor Details available' });
        } else {
            dataToSend = true;
            await storePODetails(catalystApp, vendorid, poid, ponumber, line_item_name, line_item_rate, line_item_qty, line_item_unit, line_item_total, list_of_vendor_emails, line_item_id, item_id);
            res.send(list_of_vendor_emails);
        }
    } catch (e) {
        console.log(e);
        res.status(500).send({ "status": "failure", "message": e })
    }
});

app.post('/updatePO', async function (req, res) {

    const catalystApp = catalyst.initialize(req);
    const accessToken = await catalystApp.connection(CREDENTIALS).getConnector('BooksConnector').getAccessToken();
    let vendorid = req.body.vendorid;
    let poid = req.body.poid;

    let lineDetails = req.body.lineitems;
    let lineDetailsNames = req.body.linedetailsNames;
    let winnerEmail = req.body.winnerEmail;
    let poStatus = await checkPOStatus(catalystApp, poid);

    if (poStatus) {
        let poCreationResult = await createPO(catalystApp, accessToken, vendorid, poid, lineDetails, lineDetailsNames, winnerEmail);
        if (poCreationResult) {
            res.redirect(301, '/server/bookscatalystconnection_function/getDetails');
        } else {
            res.send('Unable to create PO via auction');
        }
    } else {
        await updatePO(catalystApp, accessToken, vendorid, poid, lineDetails, lineDetailsNames, winnerEmail);
        res.redirect(301, '/server/bookscatalystconnection_function/getDetails');
    }
})

app.get('/getDetails', async (req, res) => {
    try {
        const catalystApp = catalyst.initialize(req);
        let sendToClient = await getInfoFromDB(catalystApp);
        res.status(200).send(sendToClient);
    } catch (e) {
        console.log(e);
        res.status(500).send({ "status": "failure", "message": e })
    }
})


app.post('/sendEmailsToVendors', async function (req, res) {
    try {
        const catalystApp = catalyst.initialize(req);
        sendEmail_with_Data(catalystApp, req.body.vendorEmails, req.body.ponumber);
        res.status(200).send({ "status": "success", "message": 'Mail sent to vendors' });
    } catch (e) {
        console.log(e);
        res.status(500).send({ "status": "failure", "message": e })
    }
})


module.exports = app;