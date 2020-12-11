let globalMailbox;

document.addEventListener('DOMContentLoaded', function() {

    // Use buttons to toggle between views
    document.querySelector('#inbox').addEventListener('click', () => loadMailbox('inbox'));
    document.querySelector('#sent').addEventListener('click', () => loadMailbox('sent'));
    document.querySelector('#archived').addEventListener('click', () => loadMailbox('archive'));
    document.querySelector('#compose').addEventListener('click', composeEmail);

    // By default, load the inbox
    loadMailbox('inbox');
});

function composeEmail() {

    // Show compose view and hide other views
    document.querySelector('#compose-view').style.display = 'block';
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#read-view').style.display = 'none';

    // Initialize reference variables for composition fields
    const composeRecipients = document.querySelector('#compose-recipients');
    const composeSubject = document.querySelector('#compose-subject');
    const composeBody = document.querySelector('#compose-body');

    // Flush composition fields
    composeRecipients.value = '';
    composeSubject.value = '';
    composeBody.value = '';

    // Use Submit button to collect email fields and make POST request to send email
    document.querySelector('#submit-btn').onclick = (function(event){
        event.preventDefault();
        sendEmail(composeRecipients.value, composeSubject.value, composeBody.value);
    });
}

function loadMailbox(mailbox) {

    // Show the mailbox and hide other views
    const view = document.querySelector('#emails-view');
    view.style.display = 'block';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#read-view').style.display = 'none';

    // Show the mailbox name
    view.innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

    // Set global variable to current mailbox
    globalMailbox = mailbox;

    // Fetch all emails within mailbox
    fetch('/emails/' + mailbox)
    .then(response => response.json())
    .then(emails => {
        // List Emails
        emails.forEach(loadEmails);
    });
}

function viewEmail(email){

    // Show the read-view and hide other views
    document.querySelector('#read-view').style.display = 'block';
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';

    // Mark email read as true if not already true
    if (!email.read){
        fetch('/emails/' + email.id, {
            method: 'PUT',
            body: JSON.stringify({
            read: true
            })
        });
    }

    // Populate HTML with email fields
    document.querySelector('#read-sender').innerHTML = email.sender;
    document.querySelector('#read-recipients').innerHTML = email.recipients;
    document.querySelector('#read-subject').innerHTML = email.subject;
    document.querySelector('#read-timestamp').innerHTML = email.timestamp;
    document.querySelector('#read-body').innerHTML = email.body;

    // Show the Archive and Reply buttons
    const replyDiv = document.querySelector('#reply-div');
    replyDiv.style.display = 'block';

    const archiveDiv = document.querySelector('#archive-div');
    archiveDiv.style.display = 'block';

    // Hide Reply or Archive Button depending on mailbox accessed
    if (globalMailbox === 'sent'){
        archiveDiv.style.display = 'none';
    }else if (globalMailbox === 'archive'){
        replyDiv.style.display = 'block';
    }

    // Create Reply Button
    const replyBtn = document.createElement('button');
    replyBtn.innerHTML='Reply';
    replyBtn.classList.add('reply-btn');

    // Add onclick functionality to reply button
    replyBtn.addEventListener('click', () => replyEmail(email));

    // Flush previous div value
    replyDiv.innerHTML = '';

    // Add button to div
    replyDiv.appendChild(replyBtn);

    // Create Archive Button
    const archiveBtn = document.createElement('button');
    archiveBtn.innerHTML = 'Archive';
    archiveBtn.classList.add('archive-btn');

    // Set Archive to Unarchive pending current mailbox
    if (globalMailbox === 'archive'){
        archiveBtn.innerHTML = 'Unarchive';
    }

    // Link archiveEmail function to Archive button
    archiveBtn.addEventListener('click', () => archiveEmail(email));

    // Flush previous div value
    archiveDiv.innerHTML = '';

    // Add button to div
    archiveDiv.appendChild(archiveBtn);
}

function archiveEmail(email){

    // Intialize and set variable to update archived status
    let archiveStatus = true;

    if (email.archived == true){
        archiveStatus = false;
    }

    // Make PUT request to update archived element for current email
    fetch('/emails/' + email.id, {
        method: 'PUT',
        body: JSON.stringify({
        archived: archiveStatus
        })
    })
    .then(response => loadMailbox('inbox'));
}

function loadEmails(email) {

    // Show email view, hide other views
    const view = document.querySelector('#emails-view');
    view.style.display = 'block';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#read-view').style.display = 'none';

    // Create div to contain email listing
    const entry = document.createElement('div');
    entry.innerHTML = '';

    // Add class to email if email is unread to allow differential styling
    if (!email.read){
        entry.classList.add('unread-row');
    }
    entry.classList.add('read-row');
    entry.innerHTML = `<strong>${email.sender}</strong> ${email.subject}<span class='timestamp'>${email.timestamp}</span>`;

    // Append div with entry
    view.appendChild(entry);

    // Add onclick functionality to div, linking the view email function
    entry.addEventListener('click', () => viewEmail(email));
}

function replyEmail(email){

    // Show replyEmail view, hide other views
    document.querySelector('#compose-view').style.display = 'block';
    document.querySelector('#read-view').style.display = 'none';
    document.querySelector('#emails-view').style.display = 'none';

    // Query hmtl fields
    const replyRecipients = document.querySelector('#compose-recipients');
    const replySubject = document.querySelector('#compose-subject');
    const replyBody = document.querySelector('#compose-body');

    // Flush html fields
    replyRecipients.value = "";
    replySubject.value = "";
    replyBody.value = "";

    // Populate recipient field with sender being replied to
    replyRecipients.value = email.sender;

    // Populate subject field, concat "Re: " if not already present
    if (email.subject.slice(0,4)!=='Re: '){
        email.subject = 'Re: ' + email.subject;
    }
    replySubject.value = email.subject;

    // Populate body field concat previous email to end
    replyBody.value = `\n\n\n On ${email.timestamp}, ${email.sender} wrote: ${email.body}`;

    // Onclick of submit button, populate and execute sendEmail function
    document.querySelector('#submit-btn').onclick = (function(event){
        event.preventDefault();
        sendEmail(replyRecipients.value, replySubject.value, replyBody.value);
    });
}

function sendEmail(outgoingRecipients, outgoingSubject, outgoingBody){

    // Generate POST request, populate JSON body with parameters, throw alert in case of error
    fetch('/emails', {
        method: 'POST',
            body: JSON.stringify({
            recipients: outgoingRecipients,
            subject: outgoingSubject,
            body: outgoingBody
            })
    })
    .then(response => {
        if (!response.ok){
            throw Error();
        }else{
            response.json();
        }
    })
    .then(result => {
        // Load sent mailbox
        loadMailbox('sent');
    }).catch(() => {
        alert('Submit Failed: enter valid email address.');
    });
}
