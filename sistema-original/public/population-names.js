// Display names never change the physical marking or overwrite environment text.
export function compositionName(row){const mark=String(row.servedFloorMark??row.floor??'').trim();return 'Andar '+(/^\d$/.test(mark)?mark.padStart(2,'0'):/^-\d$/.test(mark)?'-'+mark.slice(1).padStart(2,'0'):mark);}
