export function money(value: string | number | null | undefined) { if(value==null||value==="") return "—"; return `₹${Number(value).toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2})}`; }
export function dateTime(value:string){return new Date(value).toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"});}
export function dateOnly(value:string){return new Date(value).toLocaleDateString("en-IN",{dateStyle:"medium"});}
export function statusTone(status:string):"neutral"|"success"|"warning"|"danger"|"info"{if(["ACTIVE","CONFIRMED","PAID","OPEN_FOR_BOOKING"].includes(status))return"success";if(["PENDING","PENDING_APPROVAL"].includes(status))return"warning";if(["CANCELLED","FAILED","DISABLED","DEACTIVATED","SUSPENDED"].includes(status))return"danger";return"info";}
export function toIso(value:string){return new Date(value).toISOString();}
