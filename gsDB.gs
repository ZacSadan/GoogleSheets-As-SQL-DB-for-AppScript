class gsDB 
{            
    //---------------------------------------------------------
    constructor(spreadId,sheetName)
    {     
      this.MAX_NUM_COLS = 100;
      this.MAX_NUM_ROWS = 10000;

      this.spreadsheet = SpreadsheetApp.openById(spreadId);      
      this.sheet = this.spreadsheet.getSheetByName(sheetName);
      this.sheetName = sheetName;
      this.colNames = [];
      this.cache = {}; // cache for fast queries
      this.clearCacheOnUpdates = true;
      
      // first line contains the table columns names
      for (var i = 1; i <= this.MAX_NUM_COLS; i++) 
      { 
        var value = this.sheet.getRange(1,i).getValue().toString().trim();                
        if( value.length < 1  ) 
        {
          break;
        }       
        this.colNames.push(value);      
      }       
    }
    //---------------------------------------------------------  
    getNumOfActiveRows()
    {
       return this.sheet.getLastRow();
    }   
    //---------------------------------------------------------
    truncate()
    {
      var numOfRows = this.getNumOfActiveRows();            
      for ( var i = 2 ; i <= numOfRows ; i ++)
      {
          for ( var j = 1 ; j <= this.colNames.length ; j ++)
          {              
              this.sheet.getRange(i,j).setValue("")
          }
      }
      if(this.clearCacheOnUpdates)
      {
          this.cache = {}; 
          console.log("truncate:clearCache")
      }
      return true;
    }
    //---------------------------------------------------------
    add(row)
    {
      //console.log("add(row) function : before this.getNumOfActiveRows() + 1 ");
      var nextRowNum = this.getNumOfActiveRows() + 1 ;      
      //console.log("add(row) function : after this.getNumOfActiveRows() + 1 ");

      var colName = ""; var newValue = "";      
      for ( var i = 0 ; i < this.colNames.length ; i ++)
      {
          colName = this.colNames[i];
          newValue = row[colName];          
          this.sheet.getRange(nextRowNum,i+1).setValue(newValue)
      }
      if(this.clearCacheOnUpdates)
      {
          this.cache = {}; 
          console.log("add(row):clearCache")
      }
      return true;
    }
    //---------------------------------------------------------
    query(query_str)
    {        
          var query_str = "=QUERY(" + this.sheetName + "!A2:ZZZ; \"" + query_str + "\")";
          for ( var i = 0 ; i < this.colNames.length ; i ++)
          {
              const regex = new RegExp(this.colNames[i], "g");
              query_str = query_str.replace( regex , "Col"+(i+1) )
          }          
          //console.log(query_str);
          
          // very ugly and danger ...
          var sheet = this.spreadsheet.insertSheet();
          var r = sheet.getRange(1, 1).setFormula(query_str);
          SpreadsheetApp.flush();
          var reply = sheet.getDataRange().getValues();
          this.spreadsheet.deleteSheet(sheet);
          return reply;        
    }
    //---------------------------------------------------------
    query_fast(field_name,field_value)
    {
        if(this.cache != {} && this.cache[field_name] && this.cache[field_name] )
        {          
          //console.log(this.cache[field_name])
          var inx = this.cache[field_name].indexOf(field_value)
          if (inx == -1)
          {
            return null;     
          }
          var curRowArr = [];
          for ( var j = 1 ; j <= this.colNames.length ; j ++)
          {              
              // sheet start from 1 and also there is header row ...
              curRowArr.push(this.sheet.getRange(inx+2,j).getValue()); 
          }     
          //console.log("-- query_fast result from cache")
          return curRowArr;          
        }
        //-------------
        var numOfRows = this.getNumOfActiveRows()
        var col_index = -1;
        for ( var i = 0 ; i < this.colNames.length ; i ++)
        {
            if( field_name == this.colNames[i] )
              col_index = i+1;
        }
        if ( col_index == -1)
          return null;

        this.cache[field_name] = [];

        for ( var i = 2 ; i <= numOfRows ; i ++)
        {   
            var row_value = this.sheet.getRange(i,col_index).getValue()
            this.cache[field_name].push(row_value); // we need to loop even if value was found for cache ...

            if ( field_value == row_value  )
            {
              var curRowArr = [];
              for ( var j = 1 ; j <= this.colNames.length ; j ++)
              {              
                curRowArr.push(this.sheet.getRange(i,j).getValue());
              }     
              //console.log("-- query_fast result from sheet")              
            }
        }
        if ( curRowArr )
          return curRowArr;
        else
          return null;            
    }
    //---------------------------------------------------------     
    update_fast(field_name,field_value,update_field_name,update_field_value)
    {         
        var numOfRows = this.getNumOfActiveRows()
        //---------------
        var col_index = -1;
        for ( var i = 0 ; i < this.colNames.length ; i ++)
        {
            if( field_name == this.colNames[i] )
              col_index = i+1;
        }
        if ( col_index == -1)
          return false;
        //---------------
        var update_col_index = -1;
        for ( var i = 0 ; i < this.colNames.length ; i ++)
        {
            if( update_field_name == this.colNames[i] )
              update_col_index = i+1;
        }
        if ( update_col_index == -1)
          return false;
        //---------------
        for ( var i = 2 ; i <= numOfRows ; i ++)
        {
            if ( field_value == this.sheet.getRange(i,col_index).getValue() )
            {
              this.sheet.getRange(i,update_col_index).setValue(update_field_value)
              return true;              
            }
        }  
        if(this.clearCacheOnUpdates)
        {   
            this.cache = {};
            console.log("update_fast:clearCache")
        }        
        return false;      
    }
    //---------------------------------------------------------     
    update(details_for_updating_matched_rows,where_query_str)
    {         
        var rows_to_update = this.query("select * " + where_query_str)
        var numOfRows = this.getNumOfActiveRows();            

        for ( var i = 2 ; i <= numOfRows ; i ++)
        {
            var curRowArr = [];
            for ( var j = 1 ; j <= this.colNames.length ; j ++)
            {              
                curRowArr.push(this.sheet.getRange(i,j).getValue());
            }            
            for (const innerList of rows_to_update) 
            {
                if (JSON.stringify(innerList) === JSON.stringify(curRowArr)) 
                {                   
                    // found a match - current row need to be updated
                    for ( var j = 1 ; j <= this.colNames.length ; j ++)
                    {                                                       
                        if ( details_for_updating_matched_rows[this.colNames[j-1]] ) // there is a field to update
                        { 
                          var new_val = details_for_updating_matched_rows[this.colNames[j-1]] ;    
                          this.sheet.getRange(i,j).setValue(new_val);
                        }                        
                    }                    
                }
            }
        } 
        
        if(this.clearCacheOnUpdates)
        {   
            this.cache = {};
            console.log("update:clearCache")
        }
    }
    //---------------------------------------------------------
    flush()
    {      
      SpreadsheetApp.flush();

      if(this.clearCacheOnUpdates)
      {   
          this.cache = {};
          console.log("flush:clearCache")
      } 
    }
    //---------------------------------------------------------
}
