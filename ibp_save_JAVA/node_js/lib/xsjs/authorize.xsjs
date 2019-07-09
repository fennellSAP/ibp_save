$.response.contentType = "text/plain";

if ($.request.method === $.net.http.GET) {
	
	var email = $.request.parameters.get("email");
	var password = $.request.parameters.get("pwd");
	
	if (email !== undefined || email !== '' || password !== undefined || password !== '') {
		
		var connection = $.hdb.getConnection();
		var query = "SELECT * FROM \"ibp_save_JAVA.hana_db::db.users\" WHERE \"email\" = '" + email + "'";
    	var userResult = connection.executeQuery(query);
    	
    	if (userResult.length > 0) {
    		if (userResult[0].password === password) {
    			
    			$.response.setBody("true,"+userResult[0].business_user+","+userResult[0].sys_user+","+userResult[0].sys_pwd+","+userResult[0].sys_host);
    			
    		} else {
    			$.response.setBody("false,Invalid Password");
    		}
    	} else {
    		$.response.setBody("false,Invalid Email");
    	}
    	
	} else {
		$.response.setBody("false,No Data Entered");
	}
	
	
} else {
	$.response.setBody("Invalid request method");
}

