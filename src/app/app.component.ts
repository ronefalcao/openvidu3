import { Component, HostListener, OnDestroy, signal } from '@angular/core';
import {
  ReactiveFormsModule,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import {
  LocalVideoTrack,
  RemoteParticipant,
  RemoteTrack,
  RemoteTrackPublication,
  Room,
  RoomEvent,
} from 'livekit-client';
import { VideoComponent } from './video/video.component';
import { AudioComponent } from './audio/audio.component';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';

type TrackInfo = {
  trackPublication: RemoteTrackPublication;
  participantIdentity: string;
};

// When running OpenVidu locally, leave these variables empty
// For other deployment type, configure them with correct URLs depending on your deployment
var APPLICATION_SERVER_URL = '';
var LIVEKIT_URL = '';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ReactiveFormsModule, AudioComponent, VideoComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnDestroy {
  roomForm = new FormGroup({
    roomName: new FormControl('Test Room', Validators.required),
    participantName: new FormControl(
      'Participant' + Math.floor(Math.random() * 100),
      Validators.required
    ),
  });

  room = signal<Room | undefined>(undefined);
  localTrack = signal<LocalVideoTrack | undefined>(undefined);
  remoteTracksMap = signal<Map<string, TrackInfo>>(new Map());
  isRecording: boolean = false; // Estado de gravação

  constructor(private httpClient: HttpClient) {
    this.configureUrls();
  }

  configureUrls() {
    // If APPLICATION_SERVER_URL is not configured, use default value from OpenVidu Local deployment
    if (!APPLICATION_SERVER_URL) {
      if (window.location.hostname === 'localhost') {
        APPLICATION_SERVER_URL = 'http://localhost:6080/';
      } else {
        APPLICATION_SERVER_URL =
          'https://' + window.location.hostname + ':6443/';
      }
    }

    // If LIVEKIT_URL is not configured, use default value from OpenVidu Local deployment
    if (!LIVEKIT_URL) {
      if (window.location.hostname === 'localhost') {
        LIVEKIT_URL = 'ws://localhost:7880/';
      } else {
        LIVEKIT_URL = 'wss://' + window.location.hostname + ':7443/';
      }
    }
  }

  async joinRoom() {
    // Initialize a new Room object
    const room = new Room();
    this.room.set(room);

    // Specify the actions when events take place in the room
    // On every new Track received...
    room.on(
      RoomEvent.TrackSubscribed,
      (
        _track: RemoteTrack,
        publication: RemoteTrackPublication,
        participant: RemoteParticipant
      ) => {
        this.remoteTracksMap.update((map) => {
          map.set(publication.trackSid, {
            trackPublication: publication,
            participantIdentity: participant.identity,
          });
          return map;
        });
      }
    );

    // On every new Track destroyed...
    room.on(
      RoomEvent.TrackUnsubscribed,
      (_track: RemoteTrack, publication: RemoteTrackPublication) => {
        this.remoteTracksMap.update((map) => {
          map.delete(publication.trackSid);
          return map;
        });
      }
    );

    try {
      // Get the room name and participant name from the form
      const roomName = this.roomForm.value.roomName!;
      const participantName = this.roomForm.value.participantName!;

      // Get a token from your application server with the room name and participant name
      const token = await this.getToken(roomName, participantName);

      // Connect to the room with the LiveKit URL and the token
      await room.connect(LIVEKIT_URL, token);

      // Publish your camera and microphone
      await room.localParticipant.enableCameraAndMicrophone();
      this.localTrack.set(
        room.localParticipant.videoTrackPublications.values().next().value
          .videoTrack
      );
    } catch (error: any) {
      console.log(
        'There was an error connecting to the room:',
        error?.error?.errorMessage || error?.message || error
      );
      await this.leaveRoom();
    }
  }

  async leaveRoom() {
    // Leave the room by calling 'disconnect' method over the Room object
    await this.room()?.disconnect();

    // Reset all variables
    this.room.set(undefined);
    this.localTrack.set(undefined);
    this.remoteTracksMap.set(new Map());
  }

  async startRecording() {
    try {
      // Chame a API do servidor para iniciar a gravação
      await this.startRecordingServer(); // Implemente este método para interagir com o servidor
      this.isRecording = true;
      console.log('Recording started successfully.');
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  }

  private async startRecordingServer() {
    try {
      const roomName = this.roomForm.value.roomName!;
      const response = await lastValueFrom(
        this.httpClient.post(
          APPLICATION_SERVER_URL + 'start-recording', // Endpoint para iniciar a gravação
          { room: roomName }, // Parâmetros esperados pelo servidor
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )
      );

      console.log('Server recording started:', response);
    } catch (error) {
      console.error('Error starting server recording:', error);
      throw error;
    }
  }

  @HostListener('window:beforeunload')
  async ngOnDestroy() {
    // On window closed or component destroyed, leave the room
    await this.leaveRoom();
  }

  /**
   * --------------------------------------------
   * GETTING A TOKEN FROM YOUR APPLICATION SERVER
   * --------------------------------------------
   * The method below request the creation of a token to
   * your application server. This prevents the need to expose
   * your LiveKit API key and secret to the client side.
   *
   * In this sample code, there is no user control at all. Anybody could
   * access your application server endpoints. In a real production
   * environment, your application server must identify the user to allow
   * access to the endpoints.
   */
  async getToken(roomName: string, participantName: string): Promise<string> {
    const response = await lastValueFrom(
      this.httpClient.post<{ token: string }>(
        APPLICATION_SERVER_URL + 'token', // Aqui deve ser o endpoint correto para obter o token
        { roomName, participantName }
      )
    );
    return response.token;
  }
}
