export class UserRepository{
    constructor(){
        this.users={};
    }
addUser(socketId,username,avatarUrl){
this.users[socketId]={username,avatarUrl};
}
removeUser(socketId){
    const username=this.users[socketId];
    delete this.users[socketId];
    return username;
}
getUser(socketId){
    return this.users[socketId];
}
getAllUsers(){
    return this.users;
}
getUserCount(){
    return Object.keys(this.users).length;
}
}