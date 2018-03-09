
const electron = require('electron')
const {ipcRenderer} = electron


// register event handlers for all elements
document.querySelectorAll('a').forEach(el => {
    if(el.id) {
        el.addEventListener("click", handleLinkClicks);
    }
})





/**
 * handle click events on <a> dom elements
 * @param {Event} e
 */
function handleLinkClicks(e) {
    e.preventDefault()
    let msg = 'main:click:' + e.target.id
    console.log(msg)
    ipcRenderer.send(msg)
}
