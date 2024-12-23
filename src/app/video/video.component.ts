import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  Input,
  ViewChild,
} from '@angular/core';
import { LocalVideoTrack, RemoteVideoTrack } from 'livekit-client';

@Component({
  selector: 'video-component',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './video.component.html',
  styleUrls: ['./video.component.css'],
})
export class VideoComponent implements AfterViewInit, OnDestroy {
  @Input() track!: LocalVideoTrack | RemoteVideoTrack;
  @Input() participantIdentity!: string;
  @Input() local: boolean = false;
  @Input() isRecording: boolean = false; // Novo input para controlar a gravação

  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;

  recordingTime: string = '00:00'; // Tempo formatado (MM:SS)
  private timeInterval: any; // Intervalo do cronômetro

  ngAfterViewInit() {
    if (this.videoElement) {
      this.track?.attach(this.videoElement.nativeElement);
    }

    if (this.isRecording) {
      this.startRecordingTime();
    }
  }

  ngOnDestroy() {
    if (this.track) {
      this.track.detach();
    }
    this.stopRecordingTime();
  }

  startRecordingTime() {
    let elapsedTime = 0;

    this.timeInterval = setInterval(() => {
      elapsedTime++;
      this.recordingTime = this.formatTime(elapsedTime);
    }, 1000);
  }

  stopRecordingTime() {
    clearInterval(this.timeInterval);
    this.recordingTime = '00:00';
  }

  private formatTime(time: number): string {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${this.padZero(minutes)}:${this.padZero(seconds)}`;
  }

  private padZero(value: number): string {
    return value < 10 ? `0${value}` : `${value}`;
  }

  ngOnChanges() {
    console.log('isRecording', this.isRecording);
    if (this.isRecording) {
      this.startRecordingTime();
    } else {
      this.stopRecordingTime();
    }
  }
}
