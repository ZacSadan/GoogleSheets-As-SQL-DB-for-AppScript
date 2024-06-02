# GoogleSheetsSqlDB
AppScript library for querying Google Sheets as an SQL Database

```
// first line contains columns names : date_time,bool,string,number
// be sure to decalate date_time column as "Date time" in Google Sheet "Format->Number" menu
    
// paramters to function are spreadsheetId,sheetName
const gsdb = new gsDB("1lMUATEiSoTkpod1UgPfQdqcqiR8jtQh5slAH3ME","gsDB_test");

const random_row = {};
          var date = new Date();
          random_row.date_time = date ;
          random_row.bool      = Math.random() < 0.5 ? false : true;
          random_row.string    = "str_"+ Math.floor(Math.random() * (100001));
          random_row.number    = Math.floor(Math.random() * (10001)); 
success = gsdb.add(random_row);

// queries : no need for FROM, please remember to add DATE' for dates casting.
rows = gsdb.query("select date_time,bool,string,number where (string like '%str_1%')");
rows = gsdb.query_fast("number",value)

// update rows
const details_for_updating_matched_rows = {};
     var date = new Date();
     details_for_updating_matched_rows.date_time = date ;
     details_for_updating_matched_rows.string    = "str_updated"+ Math.floor(Math.random() * (100001));        
success = gsdb.update(details_for_updating_matched_rows,"where (number > 7000)");
success = gsdb.update_fast("number",rand_value,"string","str_updated_by_update_fast");

success = gsdb.truncate(); // remove all previous entries
```
