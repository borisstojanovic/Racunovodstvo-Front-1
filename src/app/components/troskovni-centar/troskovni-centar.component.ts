import { NestedTreeControl } from '@angular/cdk/tree';
import {Component, Inject, OnInit, TemplateRef} from '@angular/core';
import {TroskovniCentarService} from "../../services/troskovni-centar/troskovni-centar.service";
import {TroskovniCentar} from "../../shared/troskovni-centar";
import {MatTreeNestedDataSource} from "@angular/material/tree";
import {BookkeepingJournal} from "../../shared/bookkeeping-journal.model";
import {BookkeepingJournalService} from "../../services/bookkeeping-journal/bookkeeping-journal.service";
import {ModalDismissReasons, NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {BookkeepingJournalComponent} from "../bookkeeping-journal/bookkeeping-journal.component";
import {KontnaGrupa, Konto} from "../../shared/invoice.model";



@Component({
  selector: 'app-troskovni-centar',
  templateUrl: './troskovni-centar.component.html',
  styleUrls: ['./troskovni-centar.component.css']
})
export class TroskovniCentarComponent implements OnInit {


  constructor(private modalService: NgbModal,private centarService: TroskovniCentarService, private knjizenjeService: BookkeepingJournalService) {
  }
  closeResult = '';

  //Selected values
  selected_centar: TroskovniCentar;
  kontoToEdit: Konto;

  //FLAGS
  editFormHidden: boolean = true;
  hideKontoList: boolean = true;

  //Lists
  knjizenja: BookkeepingJournal[];
  troskovniCentri: TroskovniCentar[];
  selected_kontos: Konto[] = undefined;

  crud_operation: string = undefined;

  // Edit parameters
  editSifra: string;
  editNaziv: string;
  editukupniTrosak: number;
  editodgovornoLice: number;
  editlokacija: number;
  editParentId: TroskovniCentar;

  //editbrojNaloga: string;
  //editbrojKonta: string;
  editNazivKonta: string;
  //editSaldo: number;
  //editDatumKnjizenja: string;
  editKomentar: string;

  // Tree Configuration
  treeControl = new NestedTreeControl<TroskovniCentar>(node => node.troskovniCentarList);
  dataSource = new MatTreeNestedDataSource<TroskovniCentar>();


  ngOnInit(): void {
    this.fetchTroskovniCentri();
    this.knjizenjeService.getKnjizenja().subscribe((data) => {
      this.knjizenja = data;
    });
  }

  fetchTroskovniCentri(){
    this.centarService.getCentri().subscribe(data => {
      this.troskovniCentri = data;
      this.formatData();
      this.dataSource.data = this.troskovniCentri;
    })
  }

  formatData(): void {
    this.troskovniCentri.forEach(item => {
      item.troskovniCentarList = this.troskovniCentri.filter(function (element) {
          return element.parentTroskovniCentar && element.parentTroskovniCentar.id == item.id;
        }
      );
    })

    for (let i = 0; i < this.troskovniCentri.length; i++) {
      this.troskovniCentri[i] = this.dfsReassignment(this.troskovniCentri[i]);
    }
  }
  getIcon(node: TroskovniCentar): string {
    return this.treeControl.isExpanded(node) ? '-' : '+';
  }
  reassignObject(source: TroskovniCentar): TroskovniCentar {
    return Object.assign({}, source);
  }

  dfsCalculation(curr: TroskovniCentar, sum: number): number {
    sum += curr.ukupniTrosak;
    if (curr.troskovniCentarList) {
      for (let i = 0; i < curr.troskovniCentarList.length; i++) {
        sum = this.dfsCalculation(curr.troskovniCentarList[i], sum);
      }
    }
    return sum;
  }


  dfsReassignment(curr: TroskovniCentar): TroskovniCentar {
    curr = this.reassignObject(curr);
    if (curr.troskovniCentarList) {
      for (let i = 0; i < curr.troskovniCentarList.length; i++) {
        curr.troskovniCentarList[i] = this.dfsReassignment(curr.troskovniCentarList[i]);
      }
    }
    return curr;
  }
  popup(knjizenjeIndex: number, troskovniCentarIndex: number): void {
    let text = 'Da li zelite da iz knjiženja(' +
      this.knjizenja[knjizenjeIndex].brojNaloga +
      ') dodelite listu konta troskovnom centru(' +
      this.troskovniCentri[troskovniCentarIndex].naziv + ')?';
    if (confirm(text) == true) {
      this.centarService.assignKnizenje(this.knjizenja[knjizenjeIndex], this.troskovniCentri[troskovniCentarIndex]).subscribe(
        data => {

          // const dummyKontoList = [
          //   new Konto(new KontnaGrupa('konto-1', '1231'), 100, 50, true, false, false, false),
          //   new Konto(new KontnaGrupa('konto-2', '1232'), 200, 60, true, false, false, false),
          //   new Konto(new KontnaGrupa('konto-3', '1233'), 300, 70, true, false, false, false),
          //   new Konto(new KontnaGrupa('konto-4', '1234'), 400, 80, true, false, false, false),
          //   new Konto(new KontnaGrupa('konto-5', '1235'), 500, 90, true, false, false, false),
          //   new Konto(new KontnaGrupa('konto-6', '1236'), 600, 100, true, false, false, false),
          // ]
          // data.kontoList = dummyKontoList;
          //
          // data.kontoList.forEach(item => {
          //   item.knjizenje = this.knjizenja[knjizenjeIndex];
          // });
          this.fetchTroskovniCentri();
        });
    }
  }

  openKontos(node: TroskovniCentar) {
    console.log(node.naziv + ' '+ node.sifra);
    console.log('-----------=-----------');

    this.selected_kontos = node.kontoList;
    this.selected_centar = node;
    this.hideKontoList = !this.hideKontoList;
  }

  deleteKonto(konto: Konto) {
    console.log(this.selected_centar.kontoList);
    this.selected_centar.kontoList = this.selected_centar.kontoList.filter(data => data != konto);
    this.selected_kontos = this.selected_centar.kontoList.filter(data => data != konto);
    console.log(this.selected_centar.kontoList);
    this.updateKontoFromCentar(this.selected_centar);
  }

  editKonto() {
    if(this.editKomentar){
      if(this.kontoToEdit){
        let index: number = this.selected_centar.kontoList.findIndex(item => item.bazniKontoId === this.kontoToEdit.bazniKontoId);
        let newKonto: Konto = this.selected_centar.kontoList[index];
        newKonto.komentarKnjizenja = this.editKomentar;
        this.selected_centar.kontoList[index] = newKonto;
        this.hideKontoList = !this.hideKontoList;
        this.updateKontoFromCentar(this.selected_centar);
      }
    }else{
      alert("Podaci su nevalidni, pokusajte ponovo");
    }
  }
  updateKontoFromCentar(centar: TroskovniCentar){
    this.centarService.editCentri(centar).subscribe(data => {
      alert("Uspesna izmena")
      this.fetchTroskovniCentri();
    },error => {
      alert("Doslo je do greske izmene");
    });
  }

  toggleEdit(konto: Konto) {
    this.kontoToEdit = konto;
    this.editFormHidden = !this.editFormHidden;

    this.editKomentar = konto.komentarKnjizenja;
  }

  deleteToggle(content: TemplateRef<any>){
    this.crud_operation = "delete";
    this.modalService.open(content,
      {ariaLabelledBy: 'modal-basic-title'}).result.then((result) => {
    }, (reason) => {
      alert("Operacija nije primenjena");
    });
  }

  addToggle(content: TemplateRef<any>){
    this.crud_operation = "add";
    this.modalService.open(content,
      {ariaLabelledBy: 'modal-basic-title'}).result.then((result) => {
    }, (reason) => {
      alert("Operacija nije primenjena");
    });
  }
  editToggle(content: TemplateRef<any>){
    this.crud_operation = "edit";
    this.modalService.open(content,
      {ariaLabelledBy: 'modal-basic-title'}).result.then((result) => {
    }, (reason) => {
      alert("Operacija nije primenjena");
    });
  }

  addCentar(modal, index) {
    if(this.editSifra && this.editNaziv &&
       this.editukupniTrosak &&
          this.editodgovornoLice && this.editlokacija){
          let parent = null
          if(this.troskovniCentri.length !== 0) {
                parent = this.troskovniCentri[index];
          }
          const newCentar: TroskovniCentar = {
            sifra: this.editSifra,
            naziv: this.editNaziv,
            ukupniTrosak: 0,
            lokacijaId: this.editlokacija,
            parentTroskovniCentar: parent,
            odgovornoLiceId: this.editodgovornoLice,
            kontoList: [],
      };
          this.centarService.addCentri(newCentar, this.troskovniCentri[index]).subscribe( res => {
            alert("Uspesno dodat Troskovni Centar: " + res.naziv);
            this.ngOnInit();
          });
    }else{
      alert("Sva polja su obavezna.");
    }
    modal.close();
  }

  deleteCentar(modal, index) {
    this.centarService.deleteCentri(this.troskovniCentri[index].id).subscribe(() => {
        this.fetchTroskovniCentri();
        alert('Uspesno brisanje.');
      },error => {
        alert('Doslo je do greske.');
      }
    );
    modal.close();
  }

  editCentar(modal, index) {
    console.log(this.selected_centar);
    this.troskovniCentri[index].naziv =  this.editNaziv;
    this.troskovniCentri[index].lokacijaId = this.editlokacija;
    this.troskovniCentri[index].odgovornoLiceId = this.editodgovornoLice;
    this.centarService.editCentri(this.troskovniCentri[index]).subscribe(res => {
      this.fetchTroskovniCentri();
      alert('Uspesno izmenjen centar')
    }, error => {
      alert('Doslo je do greske');
    })
    modal.close();
  }

  getSaldo(duguje: number, potrazuje: number): number {
    return duguje - potrazuje;
  }

  getAsDate(date: string) {
    let newDate = new Date(date);
    return (
      newDate.getDate() +
      '/' +
      (newDate.getMonth() + 1) +
      '/' +
      newDate.getFullYear()
    );
  }
}
