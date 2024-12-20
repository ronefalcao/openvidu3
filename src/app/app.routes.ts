import { Routes } from '@angular/router';
import { VideoConferenceComponent } from './components/video-conference/video-conference.component';
import { RemoteParticipantComponent } from './components/remote-participant/remote-participant.component';

export const routes: Routes = [
  { path: 'host', component: VideoConferenceComponent },
  { path: '', component: RemoteParticipantComponent },
];
