
function showPersons(e, holders) {

    // show target element
    showElement('content-persons');

    // load shareholder data
    const tbody = document.querySelector('#table-persons-all > tbody')
    tbody.innerHTML = ''
    holders.forEach(person => {

        tbody.appendChild( makeTableItem(person, 'persons') )

    })



    // // activate slider
    // var slider = document.getElementById('share-no-slider');
    // noUiSlider.create(slider, {
    //     start: [1, 1170],
    //     connect: true,
    //     step: 1,
    //     orientation: 'horizontal', // 'horizontal' or 'vertical'
    //     range: {
    //         'min': 1,
    //         'max': 1170
    //     },
    //     pips : {
    //         mode: 'range',
    //         density : 3
    //     }
    // });
}