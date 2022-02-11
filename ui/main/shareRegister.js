// shares-all-filter-switch
document.querySelector("#shares-all-filter-switch").addEventListener("change", switchFilter)

function tableDataRenderer(data, type, row, meta) {
    if (meta.col == 0) {
        data = `<b>${data}</b>`
    }
    if (meta.col == 2) {
        data = translateStatus(data)
    }
    if (row.status == "canceled") {
        return `<span style="color:#999999">${data}</span>`
    } else if (row.status == "electronic") {
        return `<span style="color: var(--action-item-blue-dark)">${data}</span>`
    } else if (row.status == "reserved") {
        return `<span style="color: var(--action-item-blue-light)">${data}</span>`
    } else if (row.status == "invalidated") {
        return `<span style="color:#993333">${data}</span>`
    } else {
        return data
    }
}

function translateStatus(data) {
    switch (data) {
        case "issued":
            return "ausgestellt"
        case "electronic":
            return "elektronisch"
        case "reserved":
            return "reserviert"
        case "canceled":
            return "gelöscht"
        case "invalidated":
            return "annuliert"
        default:
            return data
    }
}

function showShareRegister(e, holders) {
    // show target element
    showElement("content-register")
    const tableEl = $("#table-share-holders-all")
    let table

    // have we initialized the DataTable before?
    if (!$.fn.dataTable.isDataTable(tableEl)) {
        // prepare data table configuration
        const config = getDataTableConfig()
        config.columns = [
            { data: "share_no", render: tableDataRenderer },
            { data: "generation", render: tableDataRenderer },
            { data: "status", render: tableDataRenderer },
            { data: "transaction", render: tableDataRenderer },
            { data: "a_code", render: tableDataRenderer },
            { data: "name", render: tableDataRenderer },
            { data: "first_name", render: tableDataRenderer },
            { data: "address", render: tableDataRenderer },
            { data: "city", render: tableDataRenderer },
            { data: "is_current", visible: false },
        ]

        // initialize DataTable
        table = tableEl.DataTable(config)
        console.log("showShareHoldersAll: initialized table")
    } else {
        table = tableEl.DataTable()
    }

    // prepare and load table data
    const tableData = []
    holders.forEach((data) => {
        tableData.push({
            share_no: helpers.pad0(data.share_no, 3),
            generation: data.generation,
            status: data.status,
            transaction: data.transaction_date,
            a_code: data.a_code,
            name: data.name,
            first_name: data.first_name,
            address: data.address,
            city: data.post_code + " " + data.city,
            is_current: data.is_current,
        })
    })

    table.clear()
    table.rows.add(tableData)
    table.column(9).search("1").draw()
    console.log("showShareHoldersAll: loaded table data")
}

function switchFilter(e) {
    e.preventDefault()
    if (e.target.checked) {
        $("#table-share-holders-all").DataTable().column(9).search("").draw()
    } else {
        $("#table-share-holders-all").DataTable().column(9).search("1").draw()
    }
}

module.exports = {
    showShareRegister,
}
