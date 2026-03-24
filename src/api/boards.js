import { api } from './client.js';

// Boards
export const getBoards      = ()           => api.get('/boards');
export const getBoard        = (id)         => api.get(`/boards/${id}`);
export const createBoard     = (data)       => api.post('/boards', data);
export const updateBoard     = (id, data)   => api.put(`/boards/${id}`, data);
export const deleteBoard     = (id)         => api.delete(`/boards/${id}`);

// Board members
export const getBoardMembers = (bid)        => api.get(`/boards/${bid}/members`);
export const addBoardMember  = (bid, data)  => api.post(`/boards/${bid}/members`, data);
export const removeBoardMember = (bid, uid) => api.delete(`/boards/${bid}/members/${uid}`);

// Columns
export const createColumn   = (bid, data)   => api.post(`/boards/${bid}/columns`, data);
export const updateColumn   = (bid, id, d)  => api.put(`/boards/${bid}/columns/${id}`, d);
export const deleteColumn   = (bid, id)     => api.delete(`/boards/${bid}/columns/${id}`);

// Cards
export const createCard     = (bid, cid, d) => api.post(`/boards/${bid}/columns/${cid}/cards`, d);
export const updateCard     = (bid, id, d)  => api.put(`/boards/${bid}/cards/${id}`, d);
export const archiveCard    = (bid, id)     => api.post(`/boards/${bid}/cards/${id}/archive`);
export const moveCard       = (bid, id, d)  => api.post(`/boards/${bid}/cards/${id}/move`, d);
export const deleteCard     = (bid, id)     => api.delete(`/boards/${bid}/cards/${id}`);

// Labels
export const createLabel    = (bid, d)      => api.post(`/boards/${bid}/labels`, d);
export const updateLabel    = (bid, id, d)  => api.put(`/boards/${bid}/labels/${id}`, d);
export const deleteLabel    = (bid, id)     => api.delete(`/boards/${bid}/labels/${id}`);

// Checklists
export const createChecklist = (bid, cid, d)      => api.post(`/boards/${bid}/cards/${cid}/checklists`, d);
export const updateChecklist = (bid, cid, id, d)  => api.put(`/boards/${bid}/cards/${cid}/checklists/${id}`, d);
export const deleteChecklist = (bid, cid, id)     => api.delete(`/boards/${bid}/cards/${cid}/checklists/${id}`);
export const addChecklistItem    = (bid, cid, clId, d)       => api.post(`/boards/${bid}/cards/${cid}/checklists/${clId}/items`, d);
export const updateChecklistItem = (bid, cid, clId, iid, d)  => api.put(`/boards/${bid}/cards/${cid}/checklists/${clId}/items/${iid}`, d);
export const deleteChecklistItem = (bid, cid, clId, iid)     => api.delete(`/boards/${bid}/cards/${cid}/checklists/${clId}/items/${iid}`);

// Comments
export const addComment    = (bid, cid, d)  => api.post(`/boards/${bid}/cards/${cid}/comments`, d);
export const deleteComment = (bid, cid, id) => api.delete(`/boards/${bid}/cards/${cid}/comments/${id}`);
