import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { SHARED_IMPORTS } from '../../../shared-imports';
import { ExpenditureService } from '../../../../services/expenditure.service';

@Component({
  selector: 'app-add-expense',
  imports: [[...SHARED_IMPORTS]],
  providers: [MessageService],
  templateUrl: './add-expense.html',
  styleUrl: './add-expense.scss',
})
export class AddExpense implements OnInit {
  @Output() saved = new EventEmitter<any>();

  expenseForm!: FormGroup;
  saving: boolean = false;

  expenseTypes = [
    { label: 'Light Bill', value: 'Light Bill' },
    { label: 'Vaifani', value: 'Vaifani' },
    { label: 'Welding', value: 'Welding' },
    { label: 'Friday Extra', value: 'Friday Extra' },
    { label: 'Worker Beam', value: 'Worker Beam' },
    { label: 'Electrician', value: 'Electrician' },
    { label: 'Checker', value: 'Checker' },
    { label: 'Petrol', value: 'Petrol' },
    { label: 'Sutar', value: 'Sutar' },
    { label: 'Worker Payment', value: 'WORKER' },
    { label: 'Mill Store', value: 'MATERIAL' },
    { label: 'Transport', value: 'TRANSPORT' },
    { label: 'Other', value: 'OTHER' }
  ];

  constructor(
    private fb: FormBuilder,
    private expenditureService: ExpenditureService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.expenseForm = this.fb.group({
      expenseType: [null, Validators.required],
      amount: [null, [Validators.required, Validators.min(1)]],
      date: [new Date(), Validators.required],
      note: ['']
    });
  }

  submit(): void {
    if (this.expenseForm.invalid) {
      this.expenseForm.markAllAsTouched();
      return;
    }

    const formValue = this.expenseForm.value;
    const date = formValue.date instanceof Date
      ? formValue.date.toISOString().split('T')[0]
      : formValue.date;

    const expenditure = {
      id: {
        date,
        expenseType: formValue.expenseType
      },
      amount: formValue.amount,
      note: formValue.note || ''
    };

    this.saving = true;
    this.expenditureService.saveExpenditure(expenditure).subscribe({
      next: (result) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Expense saved successfully',
          life: 3000
        });
        this.saving = false;
        this.saved.emit(result);
        this.expenseForm.reset({ date: new Date() });
      },
      error: () => {
        this.saving = false;
      }
    });
  }
}
