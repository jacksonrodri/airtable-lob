import {
    initializeBlock,
    Button,
    useBase,
    useRecords,
    useGlobalConfig,
    Box,
    CellRenderer,
    Heading,
    Icon,
    Text,
    ViewPickerSynced,
    Select,
} from '@airtable/blocks/ui';
import React, { useState, useEffect } from 'react';
import moment from 'moment';
import QRCode from 'qrcode';

const GlobalConfigKeys = {
    VIEW_ID: 'viewId',
};

function PrintRecordsApp() {
    const base = useBase();
    const globalConfig = useGlobalConfig();

    return (
        <div>
            <Box margin={3}>
                <Record base={base} />
            </Box>
        </div>
    );
}

// The toolbar contains the view picker and print button.
function Toolbar({base, value, statusValue}) {
    return (
        <Box className="print-hide">
            <Button
                onClick={() => {
                    if (statusValue) {
                        sendPostcards(base, value, statusValue);
                    }
                }}
                marginLeft={2}
            >
                Send
            </Button>
        </Box>
    );
}

const groupBy = (xs, key) => {
    return xs.reduce((rv, x) => {
        if (rv.findIndex(element => element === x) === -1) rv.push(x);
        return rv;
    }, []);
};

// Renders a single record from the Collections table with each
// of its linked Artists records.
function Record() {
    const base = useBase();
    const [value, setValue] = useState(null);
    const [statusValue, setStatusValue] = useState(null);
    const [batchNames, setBatchNames] = useState([]);
    const [statusList, setStatusList] = useState([]);
    let table = base.getTable('tblgt5UJCr2ML9SML');

    useEffect(() => {
        const fetch = async () => {
            let result = await table.selectRecordsAsync();
            let batches = [];
            for (let record of result.records) {
                if (batches.findIndex(element => element.value === record.getCellValue("fldq36xuFwFZ4S865").name) === -1) {
                    batches.push({
                        value: record.getCellValue("fldq36xuFwFZ4S865").name,
                        label: record.getCellValue("fldq36xuFwFZ4S865").name,
                    })
                }
            }
            setValue(batches[0].value);
            setBatchNames([...batches]);
        }
        fetch();
    }, []);

    useEffect(() => {
        if (value) {
            const fetch = async () => {
                let result = await table.selectRecordsAsync();
                let batchResult = result.records.filter(record => record.getCellValue("fldq36xuFwFZ4S865").name === value);
                let statusL = [];
                for (let record of batchResult) {
                    if (statusL.findIndex(element => element.value === record.getCellValue("fldlTfyRV3B2uycRj").name) === -1) {
                        statusL.push({
                            value: record.getCellValue("fldlTfyRV3B2uycRj").name,
                            label: record.getCellValue("fldlTfyRV3B2uycRj").name,
                        })
                    }
                }
                setStatusValue(statusL[0].value);
                setStatusList([...statusL]);
            }
            fetch();
        }
    }, [value]);

    return (
        <Box marginY={3} display="flex" alignItems="center" justifyContent="center">
            <Select
                options={batchNames}
                value={value}
                onChange={newValue => setValue(newValue)}
                size="large"
                width="200px"
                marginRight="20px"
            />
            <Select
                options={statusList}
                value={statusValue}
                onChange={newValue => setStatusValue(newValue)}
                size="large"
                width="200px"
                marginRight="10px"
            />
            <Toolbar base={base} value={value} statusValue={statusValue} />
        </Box>
    );
}

function format(num) {
    return "$" + parseInt(num).toLocaleString('en');
}

function kFormatter(n) {
    var num = parseFloat(n);
    return "$" + (Math.abs(num) > 999 ? Math.sign(num)*((Math.abs(num)/1000).toFixed(1)) + 'k' : Math.sign(num)*Math.abs(num));
}

async function sendPostcards(base, value, statusValue) {
    // replace with your own Lob API key below
    let APIkey = btoa("live_be5502e9ce398c401571b0509087ab73074" + ":");

    // tblDa0oSV1l17Gqhz is the Mail List table
    let table = base.getTable('tblgt5UJCr2ML9SML');

    let result = await table.selectRecordsAsync();
    for (let record of result.records) {
        if (value === record.getCellValue("fldq36xuFwFZ4S865").name && 
            statusValue === record.getCellValue("fldlTfyRV3B2uycRj").name
        ) {
            let name = encodeURIComponent(record.getCellValue("fldi38sRoDU3QXVCx"));
            let toAddressStreet = record.getCellValue("fldSoT5FCEDPW03Mx");
            let toAddressCity = record.getCellValue("fldJQObJCqkVfnTsp");
            let toAddressState = record.getCellValue("fldXEoZbIVQaWaf2T");
            let toAddressZIP = record.getCellValue("fldZogsBGN33BrlEp");
    
            let qrUrl = record.getCellValue("fldblMXp0r1WTLSwH");
            let offerID = record.getCellValue("fldEnAD5wSzqty8YB");
            let offerExpiration = moment(new Date(record.getCellValue("fld8frQGt5FajvZyz"))).add(1, "days").format("MMM DD, YYYY");
    
            let offerPrice = format(record.getCellValue("fldnHMu6K9OS42vJV"));
            let rentalPrice = format(record.getCellValue("fld9itYfbH6k7jJB9"));
            let gaugeLow = kFormatter(record.getCellValue("fldNNJhl4lXOA1WLI"));
            let gaugeHigh = kFormatter(record.getCellValue("fldB1HCdhelAEyxvq"));
            let sellerServiceFee = format(record.getCellValue("fldYf6dC6vuc84bL1"));
            let sellerClosingCosts = format(record.getCellValue("fldbxWRKkN2FPdNRW"));
            let repairCosts = format(record.getCellValue("fldwTm3zIAfNoB0Cq"));
            let termAssumption = record.getCellValue("fld83Mn8nrZO51Xdg");
    
            let qrcode = await QRCode.toDataURL(qrUrl, { width: 125 });
    
            let querystring = "description=Offer " + offerID + " for " + toAddressStreet + 
                "&to[name]=" + name.toString() + 
                "&to[company]=Or Current Homeowner" + 
                "&to[address_line1]=" + toAddressStreet +
                "&to[address_city]=" + toAddressCity +
                "&to[address_state]=" + toAddressState +
                "&to[address_zip]=" + toAddressZIP +
                "&from[name]=RENTBACK.COM" + 
                "&from[address_line1]=414 UNION ST STE 1900" + 
                "&from[address_city]=NASHVILLE" + 
                "&from[address_state]=TN" + 
                "&from[address_zip]=37219-1782" + 
                "&front=tmpl_e9715b10218c749" + 
                "&back=tmpl_0e5ac29cb5941ab" + // you will need to insert your own Lob template ID here.
                "&size=6x11" + 
                "&merge_variables[offerID]=" + offerID + 
                "&merge_variables[offerExpiration]=" + offerExpiration + 
                "&merge_variables[offerPrice]=" + offerPrice + 
                "&merge_variables[rentalPrice]=" + rentalPrice + 
                "&merge_variables[gaugeLow]=" + gaugeLow + 
                "&merge_variables[gaugeHigh]=" + gaugeHigh + 
                "&merge_variables[sellerServiceFee]=" + sellerServiceFee + 
                "&merge_variables[sellerClosingCosts]=" + sellerClosingCosts + 
                "&merge_variables[repairCosts]=" + repairCosts + 
                "&merge_variables[toAddressStreet]=" + toAddressStreet + 
                "&merge_variables[termAssumption]=" + termAssumption +
                "&merge_variables[qrUrl]=" + encodeURIComponent(qrcode);
    
            let response =  await fetch("https://api.lob.com/v1/postcards", {
                body: querystring,
                headers: {
                    Authorization: "Basic " + APIkey,
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                method: "POST"
            })
            let data = await response.json();
        }
    }
}

initializeBlock(() => <PrintRecordsApp />);

// live
// lob_api=live_be5502e9ce398c401571b0509087ab73074
// front=tmpl_e9715b10218c749
// back=tmpl_0e5ac29cb5941ab
// blockId=blk69Ax3ux4ebjIWc

// test
// lob_api=test_56e33dc6f0b6591e4d11aeb5bf654ef8103
// front=tmpl_ac4141547048dd4
// back=tmpl_8147056a41adbfa
// blockId=blkPrB3vf2OOpxnQV