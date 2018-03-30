
function showShareHoldersCurrent(e, holders) {
    const tbody = document.querySelector('#table-share-holders-current > tbody')

    // make sure list is empty
    tbody.innerHTML = ''
    holders.forEach(person => {
        tbody.appendChild( makeTableItem(person, 'holders_current') )
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