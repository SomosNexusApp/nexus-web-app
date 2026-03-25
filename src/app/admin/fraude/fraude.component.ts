import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../admin.service';
import { AdminFraudeFlag, AdminProductoSospechoso, DiaValorDTO } from '../admin.models';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';

@Component({
  selector: 'app-fraude',
  standalone: true,
  imports: [CommonModule, FormsModule, AvatarComponent],
  templateUrl: './fraude.component.html',
  styleUrls: ['./fraude.component.css'],
})
export class FraudeComponent implements OnInit {
  private svc = inject(AdminService);

  flags = signal<AdminFraudeFlag[]>([]);
  productos = signal<AdminProductoSospechoso[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.svc.getFraudeFlags().subscribe({ next: f => { this.flags.set(f); this.loading.set(false); } });
    this.svc.getProductosSospechosos().subscribe({ next: p => this.productos.set(p) });
  }

  marcarRevisado(userId: number): void {
    this.svc.marcarFraudeRevisado(userId).subscribe(() => {
      this.flags.update(f => f.map(x => x.id === userId ? { ...x, estado: 'REVISADO' } : x));
    });
  }
}
