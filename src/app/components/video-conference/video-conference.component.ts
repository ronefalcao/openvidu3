import { Component, OnInit, OnDestroy } from '@angular/core';
import { OpenVidu, Session, Publisher } from 'openvidu-browser';
import { OpenviduService } from '../../services/openvidu.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-video-conference',
  templateUrl: './video-conference.component.html',
  styleUrls: ['./video-conference.component.scss'],
  imports: [CommonModule],
  standalone: true,
})
export class VideoConferenceComponent implements OnInit, OnDestroy {
  sessionId: string = 'default-session';
  token: string = '';
  session: Session | null = null;
  publisher: Publisher | null = null;
  videostarted: boolean = false;
  urlRemota: string = '';

  constructor(private openviduService: OpenviduService) {}

  ngOnInit(): void {
    console.log(this.videostarted);
  }

  ngOnDestroy(): void {
    this.endVideoConference();
  }

  createSession(): void {
    this.openviduService.createSession(this.sessionId).subscribe(
      () => this.generateToken(),
      (error) => {
        if (error.status === 409) {
          console.warn('Sessão já existente. Continuando...');
          this.generateToken();
        } else {
          this.logError('Erro ao criar sessão:', error);
        }
      }
    );
  }

  generateToken(): void {
    this.openviduService.generateToken(this.sessionId).subscribe(
      (response) => {
        this.token = response.token;
        const url = new URL(this.token);
        this.urlRemota = `http://${window.location.hostname}:4200?sessionId=${
          this.sessionId
        }&token=${url.searchParams.get('token')}`;
        this.startVideoConference();
      },
      (error) => this.logError('Erro ao gerar token:', error)
    );
  }

  startVideoConference(): void {
    const OV = new OpenVidu();
    this.session = OV.initSession();

    this.session.on('streamCreated', (event) =>
      this.handleStreamCreated(event)
    );

    this.session
      .connect(this.token)
      .then(() => {
        /*     this.publisher = OV.initPublisher('video-container-local', {
          publishAudio: true,
          publishVideo: true,
          resolution: '640x480',
          frameRate: 30,
        });
        this.session?.publish(this.publisher); */

        this.publisher = OV.initPublisher('video-container-local', {
          audioSource: undefined, // Usa o microfone padrão
          videoSource: undefined, // Usa a câmera padrão
          publishAudio: true,
          publishVideo: true,
          resolution: '640x480',
          frameRate: 30,
        });

        this.session
          ?.publish(this.publisher)
          .then(() => {
            console.log('Stream local publicado com sucesso.');
          })
          .catch((error: any) => {
            console.error('Erro ao publicar stream local:', error);
          });

        this.videostarted = true;
      })
      .catch((error) => this.logError('Erro ao conectar à sessão:', error));
  }

  private handleStreamCreated(event: any): void {
    console.log('Stream criado. Detalhes do stream:', event.stream);

    const subscriber = this.session?.subscribe(event.stream, undefined);
    if (subscriber) {
      subscriber.on('videoElementCreated', (videoEvent: any) => {
        const remoteContainer = document.getElementById(
          'video-container-remote'
        );
        if (remoteContainer) {
          remoteContainer.innerHTML = '';
          remoteContainer.appendChild(videoEvent.element);
          console.log('Vídeo remoto anexado com sucesso.');
        }
      });
    } else {
      this.logError('Erro ao se inscrever no stream remoto');
    }
  }

  endVideoConference(): void {
    this.publisher?.stream
      .getMediaStream()
      .getTracks()
      .forEach((track) => track.stop());
    this.session?.disconnect();
    this.clearVideoContainers();
    this.videostarted = false;
    console.log('Sessão encerrada');
  }

  private clearVideoContainers(): void {
    const localContainer = document.getElementById('video-container-local');
    if (localContainer) {
      localContainer.innerHTML = '';
    }

    const remoteContainer = document.getElementById('video-container-remote');
    if (remoteContainer) {
      remoteContainer.innerHTML = '';
    }
  }

  private logError(message: string, error?: any): void {
    console.error(message, error || '');
  }
}
