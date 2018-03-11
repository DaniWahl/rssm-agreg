
const electron = require('electron')
const {ipcRenderer} = electron


// register event handlers for all elements
document.querySelectorAll('a').forEach(el => {
    if(el.target) {
        el.addEventListener("click", handleLinkClicks);
    }
})



/**
 * handle click events on <a> dom elements
 * @param {Event} e
 */
function handleLinkClicks(e) {
    e.preventDefault()

    // show target element
    showElement(e.target.target)

    // send message to main
    ipcRenderer.send('content:show',  e.target.target)
}


/**
 * show the specified element id, making sure all others are hidden
 * @param {String}  element_id
 */
function showElement(element_id) {

    // hide all elements
    document.querySelectorAll('.content-element').forEach(div => {
        div.classList.add('hidden')
    })

    // show selected element
    if(element_id) {
        document.querySelector(`#${element_id}`).classList.remove('hidden');
    }
}