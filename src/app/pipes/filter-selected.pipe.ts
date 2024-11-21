import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'filterSelected',
    standalone: true
})
export class FilterSelectedPipe implements PipeTransform {
    transform(users: any[], selectedUserIds: string[]): any[] {
        return users.filter(user => selectedUserIds.includes(user.id));
    }
}
