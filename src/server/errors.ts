// Map database failures to safe HTTP errors; never leak SQL or connection details.
export class AppError extends Error {
  constructor(public readonly status:number, public readonly code:string, message:string) {
    super(message); this.name="AppError";
  }
}
interface MysqlLikeError { errno?:number; code?:string; sqlState?:string; sqlMessage?:string; }
function isMysqlError(e:unknown):e is MysqlLikeError {
  return typeof e==="object" && e!==null && "errno" in e && typeof (e as MysqlLikeError).errno==="number";
}
export function toAppError(e:unknown):AppError {
  if(e instanceof AppError) return e;
  if(isMysqlError(e)) {
    switch(e.errno) {
      case 1644: return new AppError(409,"RULE_VIOLATION",e.sqlMessage??"Business rule violated");
      case 1062: return new AppError(409,"DUPLICATE","A record with this value already exists");
      case 1451: return new AppError(409,"IN_USE","This record is referenced by other records");
      case 1452: return new AppError(400,"BAD_REFERENCE","A referenced record does not exist");
      case 3819: return new AppError(400,"CHECK_FAILED","Value rejected by a database CHECK constraint");
      case 1265: case 1366: case 1406: return new AppError(400,"INVALID_VALUE","A value is not valid for its column");
      case 1142: case 1143: case 1370: return new AppError(403,"DB_PRIVILEGE","The database refused this operation for your role");
    }
  }
  return new AppError(500,"INTERNAL","Unexpected server error");
}
