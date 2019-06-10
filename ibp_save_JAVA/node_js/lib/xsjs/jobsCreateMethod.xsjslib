// function iCreate(param){
//     let after = param.afterTableName;
//     let pStmt = param.connection.prepareStatement('select * from "' + after + '"');
//     var log = SESSIONINFO.recordSetToJSON(pStmt.executeQuery(), "Job_Results");
//     var uuid = create_UUID();
    
    
    
//     pStmt.executeQuery();
//     var rs = pStmt.executeQuery();
    
    
    
//     if (rs.next()) {

//         pStmt = param.connection.prepareStatement('insert into "ibp_save_JAVA.hana_db::db.descriptors"("guid") values(?)');
//         pStmt.setString(1, rs.getString(1));          
//         pStmt.executeUpdate();
//         pStmt.close();
        
//     }
//     rs.close();
    
    
//     function create_UUID() {
// 	var dt = new Date().getTime();
// 	var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
// 		var r = (dt + Math.random() * 16) % 16 | 0;
// 		dt = Math.floor(dt / 16);
// 		return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
// 	});
// 	return uuid;
// }
