import mysql,{type Pool} from "mysql2/promise";
let pool:Pool|undefined;
/** Root access is confined to destructive fixture setup in the isolated test database. */
export function getTestRootPool():Pool {
 if(!pool)pool=mysql.createPool({
  host:process.env.MYSQL_HOST??"127.0.0.1",
  port:Number(process.env.MYSQL_PORT??3307),
  user:"root",password:process.env.MYSQL_ROOT_PASSWORD,
  database:process.env.MYSQL_DATABASE,
  connectionLimit:2,dateStrings:true,decimalNumbers:true
 });
 return pool;
}
export async function closeTestRootPool() {
 if(pool){await pool.end();pool=undefined;}
}
