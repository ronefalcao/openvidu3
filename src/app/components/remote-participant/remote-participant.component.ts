import { Component, OnInit, OnDestroy } from '@angular/core';
import { OpenVidu } from 'openvidu-browser';
import { OpenviduService } from '../../services/openvidu.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-remote-participant',
  templateUrl: './remote-participant.component.html',
  styleUrls: ['./remote-participant.component.scss'],
  standalone: true,
})
export class RemoteParticipantComponent implements OnInit, OnDestroy {
  session: any;
  token: string = '';
  sessionId: string = 'default-session'; // Id fixo para exemplo

  constructor(
    private route: ActivatedRoute,
    private openviduService: OpenviduService
  ) {}

  ngOnInit(): void {
    /*     navigator.mediaDevices
  .getUserMedia({ video: true, audio: true })
  .then((stream) => {
    console.log('Câmera e microfone acessados com sucesso:', stream);
    const videoElement = document.createElement('video');
    videoElement.srcObject = stream;
    videoElement.autoplay = true;
    document.getElementById('video-container-remote')?.appendChild(videoElement);
  })
  .catch((error) => {
    console.error('Erro ao acessar câmera e microfone:', error);
  }); */

    // Obtendo o token e sessionId da URL
    this.token = this.route.snapshot.queryParams['token'];
    this.sessionId =
      this.route.snapshot.queryParams['sessionId'] || 'default-session';

    // Gerar token e conectar-se à sessão
    this.generateTokenAndConnect();
  }

  ngOnDestroy(): void {
    if (this.session) {
      this.session.disconnect();
      console.log('Sessão encerrada.');
    }
  }

  generateTokenAndConnect(): void {
    // Gera um novo token para a sessão existente
    this.openviduService.generateToken(this.sessionId).subscribe(
      (response) => {
        this.token = response.token; // Token atualizado
        console.log('Token gerado:', this.token);
        this.connectToSession(); // Conecta à sessão com o novo token
      },
      (error) => {
        console.error('Erro ao gerar token:', error);
      }
    );
  }

  connectToSession(): void {
    console.log('Conectando à sessão com o token:', this.token);
    const OV = new OpenVidu();
    this.session = OV.initSession();

    this.session.on(
      'streamCreated',
      (event: any) => {
        console.log('Stream remoto criado:', event.stream);
        if (event.stream.hasVideo) {
          console.log('Stream remoto contém vídeo.');
        } else {
          console.log('Stream remoto contém apenas áudio.');
        }
        // Assinar o stream
        const subscriber = this.session.subscribe(event.stream, undefined);
        if (subscriber) {
          console.log('Subscriber criado com sucesso');
        } else {
          console.error('Erro ao criar subscriber');
        }
        // Quando o elemento de vídeo for criado
        subscriber.on('videoElementCreated', (videoEvent: any) => {
          console.log('Elemento de vídeo criado', videoEvent);

          const remoteContainer = document.getElementById(
            'video-container-remote'
          );
          if (remoteContainer) {
            remoteContainer.innerHTML = ''; // Limpa o contêiner antes de adicionar o novo vídeo
            remoteContainer.appendChild(videoEvent.element); // Adiciona o vídeo ao contêiner
            console.log('Vídeo remoto anexado ao contêiner.');
          } else {
            console.error('Contêiner de vídeo remoto não encontrado.');
          }
        });
      },
      (error: any) => {
        console.error('Erro ao assinar o stream remoto:', error);
      }
    );

    // Manipula streams destruídos
    this.session.on('streamDestroyed', (event: any) => {
      console.warn('Stream remoto destruído:', event.stream);

      const remoteContainer = document.getElementById('video-container-remote');
      if (remoteContainer) {
        remoteContainer.innerHTML = '<p>Stream remoto foi desconectado.</p>';
      }
    });

    // Conecta à sessão
    this.session
      .connect(this.token)
      .then(() => {
        console.log('Conexão bem-sucedida com a sessão.');
      })
      .catch((error: any) => {
        console.error('Erro ao conectar à sessão:', error);
      });
  }
}
