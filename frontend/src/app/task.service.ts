import { Injectable } from '@angular/core';
import { WebRequestService } from './web-request.service';
import { Task } from './models/task.model';

@Injectable({
  providedIn: 'root'
})
export class TaskService {


  constructor(private WebRequestService: WebRequestService) { }

  getLists(){
    return this.WebRequestService.get('lists');
  }

  createList(title: string){
    // Send a web request to send a list
   return this.WebRequestService.post('lists', {title});
  }

  updateList(listId: string, title: string){
    // Send a web request to update a list
   return this.WebRequestService.patch(`lists/${listId}`, {title});
  }

  deleteList(listId: string){
    return this.WebRequestService.delete(`lists/${listId}`);
  }

  getTasks(listId: string){
    return this.WebRequestService.get(`lists/${listId}/tasks`);
  }

  createTask(title: string, listId: string) {
    return this.WebRequestService.post(`lists/${listId}/tasks`, {title});
  }

  updateTask(listId: string, taskId: string, title: string){
    // Send a web request to update a list
   return this.WebRequestService.patch(`lists/${listId}/tasks/${taskId}`, {title});
  }

  deleteTask(listId:string, taskId: string){
    return this.WebRequestService.delete(`lists/${listId}/tasks/${taskId}`);
  }

  completeTask(task: Task){
    return this.WebRequestService.patch(`lists/${task._listId}/tasks/${task._id}`, {
      completedTask: !task.completedTask
    });
  }
}
