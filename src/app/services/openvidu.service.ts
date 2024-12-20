import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class OpenviduService {
  private serverUrl = 'http://localhost:4443'; // URL do OpenVidu Server
  private secret = 'safeweb'; // Mesma senha usada ao iniciar o servidor

  constructor(private httpClient: HttpClient) {}

  createSession(sessionId: string): Observable<any> {
    const body = JSON.stringify({ customSessionId: sessionId });
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + btoa('OPENVIDUAPP:' + `${this.secret}`),
    });

    return this.httpClient.post(
      `${this.serverUrl}/openvidu/api/sessions`,
      body,
      {
        headers,
      }
    );
  }

  generateToken(sessionId: string): Observable<any> {
    return this.httpClient.post(
      `http://localhost:4443/openvidu/api/sessions/${sessionId}/connection`,
      '{}',
      {
        headers: new HttpHeaders({
          'Content-Type': 'application/json',
          Authorization: 'Basic ' + btoa('OPENVIDUAPP:' + `${this.secret}`),
        }),
      }
    );
  }
}
