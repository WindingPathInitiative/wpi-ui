import { Component, OnInit, input, output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HubService } from '../../core/hub.service';
import { Office } from '../../core/models';

interface RoleRow {
  name: string;
  checked: boolean;
  disabled: boolean;
  label: string;
}

@Component({
  selector: 'app-office-form',
  imports: [FormsModule],
  templateUrl: './office-form.html',
})
export class OfficeFormComponent implements OnInit {
  readonly office = input<Office>();
  readonly primaryOffice = input<Office>();
  readonly officeAuthority = input.required<Office>();

  readonly officeResult = output<Office | null>();

  private readonly hub = inject(HubService);
  protected readonly editingOffice = signal<Partial<Office>>({});
  protected readonly roleRows = signal<RoleRow[] | null>(null);

  ngOnInit(): void {
    const office = this.office();
    const primary = this.primaryOffice();
    const auth = this.officeAuthority();

    const editing: Partial<Office> = {};
    if (office) {
      editing.id = office.id;
      editing.name = office.name;
      editing.email = office.email;
    }
    if (primary) editing.parentOfficeID = primary.id;
    this.editingOffice.set(editing);

    if (!office || office.id !== auth.id) {
      const roles = this.hub.officeRoles();
      const rows: RoleRow[] = Object.keys(roles).map(name => {
        let disabled = !auth.roles.includes(name);
        if (primary) {
          disabled = !primary.roles.includes(name);
        }
        return {
          name,
          checked: !!office?.roles?.includes(name),
          disabled,
          label: roles[name],
        };
      });
      this.roleRows.set(rows);
    }
  }

  protected save(): void {
    const editing = { ...this.editingOffice() } as Office;
    const rows = this.roleRows();
    if (rows) {
      editing.roles = rows.filter(r => r.checked).map(r => r.name);
    }
    this.officeResult.emit(editing);
  }

  protected cancel(): void {
    this.officeResult.emit(null);
  }
}
