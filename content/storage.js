class baseStorage {
  constructor(tablename,dbConn) {    
    if (/^[a-zA-Z]+$/.test(tablename)){
    	this.tablename = tablename;
        this.dbConn = dbConn;
        if (!this.dbConn.tableExists(tablename)) {
          this.dbConn.createTable(tablename,"key STRING UNIQUE, value STRING");
        }
    } else {
        throw ("Table name is invalid!");
    }
  }

  get length() { //Возвращает число, представляющее количество элементов в объекте Storage.
    let result = null;
    let statement = this.dbConn.createStatement("SELECT rowid FROM "+this.tablename+" ORDER BY rowid DESC LIMIT 1");
    if (statement.executeStep()) {
       result = statement.row.rowid + 1;
    }
    statement.reset();
    return result;
  }

  key(index) { //Передав число n, метод вернёт имя n-ного ключа в Storage
    let result = null;
    let statement = this.dbConn.createStatement("SELECT key FROM "+this.tablename+" WHERE rowid = :rowid;");
    statement.params.rowid = index;
    if (statement.executeStep()) {
       result = statement.row.key;
    }
    statement.reset();
    return result;
  }


  getItem(key){ //Передав имя ключа, метод вернёт значение ключа. 
    let result = null;
    let statement = this.dbConn.createStatement("SELECT (value) FROM "+this.tablename+" WHERE key = :key;");
    statement.params.key = key;
    if (statement.executeStep()) {
      try {
        result = JSON.parse(statement.row.value);
      } catch (e){ //value is not a json
        result = statement.row.value;
      }
    }
    statement.reset();
    return result;

  }


  setItem(key,value) {
    let statement = this.dbConn.createStatement("SELECT * FROM "+this.tablename+" WHERE key = :key;");
    statement.params.key = key;
    if (statement.executeStep()) {
       //if key exist, update
       statement.reset();
       statement = this.dbConn.createStatement("UPDATE "+this.tablename+" SET value=:value WHERE key=:key;");                 
    } else {
       //if key not exist - insert
       statement.reset();
       statement = this.dbConn.createStatement("INSERT INTO "+this.tablename+"(key,value) VALUES(:key,:value);");
    }
    statement.params.key = key;
    statement.params.value=JSON.stringify(value);
    statement.execute(); 
  }

  removeItem(key) { //Передав имя ключа, метод удалит этот ключ из Storage.
    let statement = this.dbConn.createStatement("DELETE FROM "+this.tablename+" WHERE key = :key;");
    statement.params.key = key;
    statement.execute();
  }

  clear() { //При вызове, метод удалит все ключи из Storage.
    let statement = this.dbConn.createStatement("DELETE FROM "+this.tablename+";");
    statement.execute();
  }

};


var localStorage=new baseStorage("localStorage",dbConn);