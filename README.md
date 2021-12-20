A code sample for connection between Books and Catalyst and vice versa.

API Requirements :

Kindly visit the Zoho Developer Console(api-console.zoho.com), enable self client and generate a code with the scopes ZohoBooks.contacts.CREATE,ZohoBooks.contacts.READ,ZohoBooks.contacts.UPDATE,ZohoBooks.purchaseorders.CREATE,ZohoBooks.purchaseorders.UPDATE,ZohoBooks.purchaseorders.READ. 
Generate a refresh token with the code (https://catalyst.zoho.com/help/api/introduction/access-and-refresh.html).

Catalyst Requirements :

Kindly create a Table in the Catalyst Console named "PODetails" with the following columns :

email - Text |
contact_id - text |
poid - text |
name - text |
vendor_id - text |
total - text |
ponumber - text |
lineItemWinner - boolean |
rate - text |
lineitem - text |
itemid - text |
qty - text |
unit - text |

Configure your from email address for sending mail in the MAIL tab of the Catalyst Console.

Once the above process is complete, clone the code and replace the replace the Client ID, Client Secret and Refresh Token generated in the API Requirements step in the code wherever necessary.

Once the replacements are completed, deploy the code using the command "catalyst deploy" to the Catalyst Console.

Books Requirements :

You need to create a webhook for Purchase Order Module in books with the following details :

Name - SendPOtoCatalyst
Module - Purchase Order
URL to notify - YOUR_APP_DOMAIN/server/bookscatalystconnection_function/receiveBooksInfo
Method - POST
Authorization Type - Self Authorization
Entity Parameters - Append All Parameters

and save the WebHook.

Once the above process is completed, the Books Catalyst Connection is completed and good to go !

Catalyst Help Documentation : https://catalyst.zoho.com/help/ 
Catalyst Tutorials : https://catalyst.zoho.com/help/tutorials/index.html 
Catalyst Quick Start Guide : https://catalyst.zoho.com/help/quick-start-guide.html
