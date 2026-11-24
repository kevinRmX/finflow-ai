import { Global, Module } from '@nestjs/common';
import { CryptoService } from './crypto.service.js';

@Global()
@Module({
  providers: [{ provide: CryptoService, useFactory: () => new CryptoService() }],
  exports: [CryptoService],
})
export class CommonModule {}
