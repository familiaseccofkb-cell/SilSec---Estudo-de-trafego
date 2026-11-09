// Controle de acesso aos projetos: bloqueio do administrador com dupla conferência,
// solicitação e aprovação pelo proprietário, aceite de alterações e acesso do gestor da empresa.
import {audit} from './collaboration.mjs';

const now=()=>new Date().toISOString(),uid=()=>crypto.randomUUID();
const WINDOW_MS=2*60*60*1000;
const sql=(db,q,a=[])=>db.prepare(q).bind(...a);
const first=(db,q,a)=>sql(db,q,a).first();
const all=async(db,q,a)=>(await sql(db,q,a).all()).results;
const run=(db,q,a)=>sql(db,q,a).run();
const fail=(status,message)=>{throw Object.assign(new Error(message),{status});};

// Administrador em projeto de outro usuário: entra bloqueado.
export const lockedAdmin=(user,row)=>user?.role==='admin'&&row.owner_id!==user.id;

// Gestor da empresa vê e altera projetos de todos os membros ativos da própria empresa.
export async function sharedOrgManager(db,user,ownerId){
  if(!user||!ownerId||user.id===ownerId)return false;
  const mine=await first(db,"SELECT organization_id FROM silsec_memberships WHERE member_id=? AND level='manager' AND active=1",[user.id]);
  if(!mine)return false;
  const theirs=await first(db,'SELECT 1 AS ok FROM silsec_memberships WHERE member_id=? AND organization_id=? AND active=1',[ownerId,mine.organization_id]);
  return !!theirs;
}

const pendingChange=(db,projectId)=>first(db,"SELECT * FROM project_changes WHERE project_id=? AND status='pending'",[projectId]);
const activeWindow=(db,user,projectId)=>first(db,"SELECT * FROM project_access_requests WHERE project_id=? AND requester_id=? AND status='approved' AND expires_at>?",[projectId,user.id,now()]);

// Estado do projeto para quem consulta; devolve também se o usuário pode editar.
export async function reviewState(db,user,row,baseCanEdit,{log=true}={}){
  const owner=row.owner_id===user.id,locked=lockedAdmin(user,row),change=await pendingChange(db,row.id);
  const review={viewer:owner?'owner':locked?'admin':'manager',state:'open',windowExpiresAt:null,pendingChange:null,requests:[]};
  if(change)review.pendingChange={id:change.id,requesterEmail:change.requester_email,createdAt:change.created_at};
  let canEdit=!!baseCanEdit&&!change;
  if(locked){
    const win=await activeWindow(db,user,row.id),mine=await first(db,"SELECT id FROM project_access_requests WHERE project_id=? AND requester_id=? AND status='pending'",[row.id,user.id]);
    review.state=change?'pending_acceptance':win?'unlocked':mine?'awaiting_approval':'locked';
    review.windowExpiresAt=win?.expires_at||null;
    canEdit=!!win&&!change;
  }else{
    review.state=change?'pending_acceptance':'open';
    if(owner)review.requests=(await all(db,"SELECT id,requester_email,created_at FROM project_access_requests WHERE project_id=? AND status='pending' ORDER BY created_at",[row.id])).map(r=>({id:r.id,requesterEmail:r.requester_email,createdAt:r.created_at}));
    else if(log&&baseCanEdit!==undefined)await audit(db,user,row.id,'project.view',{role:user.role});
  }
  return {canEdit,review};
}

// Rotas próprias do controle e bloqueio das demais escritas. Retorna resposta, ou null para seguir o fluxo normal.
export async function reviewApi(ctx){
  const {db,user,parts,method,body,json}=ctx;
  if(parts[0]!=='projects'||!parts[1]||!user)return null;
  const pid=parts[1],row=await first(db,'SELECT * FROM projects WHERE id=?',[pid]);
  if(!row)return null;
  const owner=row.owner_id===user.id,locked=lockedAdmin(user,row);

  if(method==='POST'&&parts.length===3&&parts[2]==='enter'){
    if(!locked)fail(400,'Este fluxo é exclusivo do administrador em projetos de outros usuários.');
    await audit(db,user,pid,'project.enter',{});
    return json({ok:true,state:'locked'});
  }
  if(parts[2]==='access-requests'){
    if(method==='POST'&&parts.length===3){
      if(!locked)fail(400,'Somente o administrador solicita acesso a projetos de outros usuários.');
      if(await first(db,"SELECT id FROM project_access_requests WHERE project_id=? AND requester_id=? AND status='pending'",[pid,user.id]))fail(409,'Já existe uma solicitação pendente para este projeto.');
      const rid=uid();
      await run(db,'INSERT INTO project_access_requests (id,project_id,requester_id,requester_email,status,expires_at,created_at,decided_at,decided_by) VALUES (?,?,?,?,?,?,?,?,?)',[rid,pid,user.id,user.email,'pending',null,now(),null,null]);
      await audit(db,user,pid,'access.request',{requestId:rid});
      return json({id:rid,status:'pending'});
    }
    if(!owner)fail(403,'Somente o proprietário do projeto decide sobre solicitações de acesso.');
    if(method==='POST'&&parts.length===5&&['approve','deny'].includes(parts[4])){
      const req=await first(db,"SELECT * FROM project_access_requests WHERE id=? AND project_id=? AND status='pending'",[parts[3],pid]);
      if(!req)fail(404,'Solicitação não encontrada ou já decidida.');
      const approve=parts[4]==='approve',stamp=now(),expires=approve?new Date(Date.now()+WINDOW_MS).toISOString():null;
      await run(db,'UPDATE project_access_requests SET status=?,expires_at=?,decided_at=?,decided_by=? WHERE id=?',[approve?'approved':'denied',expires,stamp,user.id,req.id]);
      await audit(db,user,pid,approve?'access.approve':'access.deny',{requestId:req.id,requesterEmail:req.requester_email,expiresAt:expires});
      return json({id:req.id,status:approve?'approved':'denied',expiresAt:expires});
    }
  }
  if(parts[2]==='changes'&&method==='POST'&&parts.length===5&&['accept','reject'].includes(parts[4])){
    if(!owner)fail(403,'Somente o proprietário aceita ou recusa alterações.');
    const c=await first(db,"SELECT * FROM project_changes WHERE id=? AND project_id=? AND status='pending'",[parts[3],pid]);
    if(!c)fail(404,'Alteração não encontrada ou já decidida.');
    const stamp=now();
    if(parts[4]==='accept'){
      await run(db,"UPDATE project_changes SET status='accepted',decided_at=?,decided_by=? WHERE id=?",[stamp,user.id,c.id]);
      await audit(db,user,pid,'change.accept',{changeId:c.id});
      return json({id:c.id,status:'accepted'});
    }
    // Restaura o estudo anterior. A revisão avança (invalida cópias abertas); se o estado anterior era calculado, a revisão calculada acompanha,
    // porque o estudo restaurado é exatamente o que gerou aquele cálculo — sem isso o projeto exigiria recálculo sem motivo.
    const restoredRevision=row.revision+1,restoredCalculated=c.previous_status==='calculated'&&c.previous_calculated_revision!==null?restoredRevision:c.previous_calculated_revision;
    const restoredName=c.previous_name??(JSON.parse(c.previous_study_json||'{}').name||row.name);
    await run(db,'UPDATE projects SET study_json=?,status=?,calculation_snapshot=?,calculated_revision=?,revision=?,updated_at=?,name=?,client_id=? WHERE id=?',[c.previous_study_json,c.previous_status,c.previous_snapshot_json,restoredCalculated,restoredRevision,stamp,restoredName,c.previous_client_id??row.client_id,pid]);
    await run(db,"UPDATE project_changes SET status='rejected',decided_at=?,decided_by=? WHERE id=?",[stamp,user.id,c.id]);
    await audit(db,user,pid,'change.reject',{changeId:c.id});
    return json({id:c.id,status:'rejected'});
  }

  // Demais escritas no projeto
  if(method!=='GET'){
    const change=await pendingChange(db,pid);
    if(locked){
      const isSave=parts.length===2&&method==='PUT';
      if(!isSave)fail(403,'Projeto bloqueado. Solicite acesso ao proprietário para fazer alterações.');
      if(!(await activeWindow(db,user,pid)))fail(403,'Projeto bloqueado. Solicite acesso ao proprietário para fazer alterações.');
    }
    if(change&&!(locked&&parts.length===2&&method==='PUT'))fail(409,'Há uma alteração aguardando o aceite do proprietário.');
  }
  return null;
}

// Registra a gravação feita por quem não é proprietário; o acesso do administrador vira alteração pendente de aceite.
export async function recordProjectWrite(db,user,before,revision){
  if(!before||before.owner_id===user.id)return;
  if(lockedAdmin(user,before)){
    const win=await activeWindow(db,user,before.id);
    if(!win)return;
    await run(db,"UPDATE project_access_requests SET status='used',decided_at=? WHERE id=?",[now(),win.id]);
    const cid=uid();
    await run(db,'INSERT INTO project_changes (id,project_id,requester_id,requester_email,request_id,status,previous_study_json,previous_status,previous_snapshot_json,previous_calculated_revision,previous_revision,new_revision,created_at,decided_at,decided_by,previous_name,previous_client_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',[cid,before.id,user.id,user.email,win.id,'pending',before.study_json,before.status,before.calculation_snapshot||null,before.calculated_revision??null,before.revision,revision,now(),null,null,before.name,before.client_id]);
    await audit(db,user,before.id,'change.pending',{changeId:cid,revision});
    return;
  }
  await audit(db,user,before.id,'project.update',{revision,role:user.role});
}
