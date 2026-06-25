import { Component, OnInit, inject, forwardRef, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { HubService } from '../../core/hub.service';
import { OrgUnit, OrgUnitSearch } from '../../core/models';

@Component({
  selector: 'app-orgunit-dropdown',
  imports: [NgSelectModule, FormsModule],
  template: `
    @if (orgUnits().length) {
      <ng-select [(ngModel)]="value" [items]="orgUnits()" bindValue="id"
        [searchable]="true" placeholder="Select location">
        <ng-template ng-label-tmp let-item="item">
          {{ item.code }} {{ item.name }}@if (item.location) { ({{ item.location }})}
        </ng-template>
        <ng-template ng-option-tmp let-item="item">
          {{ item.code }} {{ item.name }}@if (item.location) { ({{ item.location }})}
        </ng-template>
      </ng-select>
    }
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => OrgunitDropdownComponent),
      multi: true,
    },
  ],
})
export class OrgunitDropdownComponent implements OnInit, ControlValueAccessor {
  private readonly hub = inject(HubService);
  protected readonly orgUnits = signal<OrgUnit[]>([]);

  private _value: number | null = null;
  private onChange: (v: number | null) => void = () => {};
  protected onTouched: () => void = () => {};

  get value(): number | null { return this._value; }
  set value(v: number | null) {
    this._value = v;
    this.onChange(v);
  }

  writeValue(v: number | null): void { this._value = v; }
  registerOnChange(fn: (v: number | null) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }

  ngOnInit(): void {
    const search: OrgUnitSearch = { types: ['Nation', 'Region', 'Chapter'] };
    this.hub.getOrgUnits(search).subscribe(units => this.orgUnits.set(units));
  }
}
