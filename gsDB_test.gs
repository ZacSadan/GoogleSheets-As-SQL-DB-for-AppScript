function test_gsDB()
{    
    // first line contains columns names : date_time,bool,string,number
    // be sure to decalate date_time column as "Date time" in Google Sheet "Format->Number" menu
    
    // paramters to function are spreadsheetId,sheetName
    const gsdb = new gsDB("1lMUATEiSoTkpod1UgPfQdqcqiR8jtQh5slAH3MEsK","gsDB_test");

    // remove all previous entries
    success = gsdb.truncate(); 
    
    // add random rows
    for ( var i = 0 ; i < 10 ; i ++)
    {
      const random_row = {};
          var date = new Date();
          random_row.date_time = date ;
          random_row.bool      = Math.random() < 0.5 ? false : true;
          random_row.string    = "str_"+ Math.floor(Math.random() * (100001));
          random_row.number    = Math.floor(Math.random() * (10001)); 
    
      if ( i == 6 )
        rand_value = random_row.number;

      success = gsdb.add(random_row);
    }    
    // flush addition
    success = gsdb.flush()

    // queries : no need for FROM, please remember to add DATE' for dates casting.
    rows = gsdb.query("select date_time,bool,string,number where (string like '%str_1%')");
    console.log("RESULTS FOR : 'select date_time,bool,string,number where (string like '%str_1%')'.");
    console.log(rows);
    
    rows = gsdb.query("select string,number where (number > 7000)");
    console.log("RESULTS FOR : 'select string,number where (number > 7000)'.");
    console.log(rows);
    
    rows = gsdb.query_fast("number",rand_value)
    console.log("RESULTS FOR : gsdb.query_fast(number,",rand_value,")");
    console.log(rows);

     rows = gsdb.query_fast("number",rand_value)
    console.log("RESULTS FOR : CACHE gsdb.query_fast(number,",rand_value,")");
    console.log(rows);

    rows = gsdb.query_fast("number",1234567890)
    console.log("RESULTS FOR : gsdb.query_fast(number,1234567890) [should be empty]");
    console.log(rows);

    // update rows
    const details_for_updating_matched_rows = {};
        var date = new Date();
        details_for_updating_matched_rows.date_time = date ;
        details_for_updating_matched_rows.string    = "str_updated"+ Math.floor(Math.random() * (100001));        
    
    gsdb.clearCacheOnUpdates = false ;
    success = gsdb.update(details_for_updating_matched_rows,"where (number > 7000)");
    
    success = gsdb.update_fast("number",rand_value,"string","str_updated_by_update_fast");

    // flush updates
    success = gsdb.flush()   
    
}
