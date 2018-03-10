const electron = require('electron')
const pad0 = require('../../lib/app.helpers').pad0
const {ipcRenderer} = electron
const shareList = document.querySelector('ul')






ipcRenderer.on('shares:show', function(e, shares) {

    // make sure list is empty
    shareList.innerHTML = ''
    shares.forEach(share => {
        shareList.appendChild( makeShareItem(share) )
    })
})




function makeShareItem(share) {
    const li = document.createElement('li')
    li.className = 'collection-item avatar'

    const share_no = pad0(share.share_no, 3);
    const avatar = '<img src="../../assets/certificate.png" class="circle">'
    const title = `<span class="title">${share.type} <b>${share_no}</b></span>`
    const text = `<p>CHF ${share.value}, Emission: ${share.emission_date}</p>`

    li.innerHTML = avatar + title + text;
    return li
}

