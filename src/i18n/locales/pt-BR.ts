/**
 * Português (Brasil).
 *
 * Glossário: secret · cofre (vault) · conta · frase secreta (passphrase) ·
 *   entrada · código · mostrador. Vocabulário brasileiro: aba (não
 *   « separador »), câmera, arquivo, salvar.
 * Registro: impessoal e direto, como nas ferramentas para desenvolvedores.
 * Aspas: “ … ”, o uso corrente no Brasil.
 * Plural: CLDR dá one/many/other; « many » só afeta números enormes e repete o
 *   texto de « other ».
 */

import type { Strings } from '../strings';

export default {
  'meta.title': 'Clockwork — Autenticador TOTP',
  'meta.description':
    'Clockwork — autenticador TOTP. Gera códigos de dois fatores inteiramente no navegador, ' +
    'sem nenhuma requisição de rede.',
  'brand.tagline': 'Autenticador TOTP · RFC 6238',
  'skip.toCodes': 'Ir para os códigos',

  'status.line': '{connection} · {vault}',
  'status.offline': 'Off-line',
  'status.vault.off': 'nada é salvo',
  'status.vault.locked': 'cofre trancado',
  'status.vault.open': 'cofre aberto',

  'zone.input': 'Entrada',
  'zone.vault': 'Cofre',
  'zone.codes': 'Códigos',

  'input.legend': 'Uma entrada por linha',
  'input.help.formats': 'Base32, {nameSecret} ou {uri} — misturados. {hash} começa uma nota.',
  'input.help.images':
    'Imagens com código QR também podem ser arrastadas para cá ou coladas com {paste}.',
  'input.help.migration':
    'Exportações do Google Authenticator ({migration}) são convertidas automaticamente.',
  'shortcut.modifier': 'Ctrl',

  'input.count.accounts': { one: '{n} conta', many: '{n} contas', other: '{n} contas' },
  'input.count.errors': { one: '{n} erro', many: '{n} erros', other: '{n} erros' },
  'input.count.join': '{accounts} · {errors}',

  'key.demo': 'Inserir demonstração',
  'key.clear': 'Limpar',
  'key.qrImage': 'QR a partir de imagem',
  'key.camera': 'Câmera',
  'key.cameraStop': 'Desligar câmera',
  'key.copy': 'Copiar',
  'key.copyDone': 'Copiado',
  'key.copyFailed': 'Falhou',

  'viewfinder.hint': 'Mantenha o código QR dentro da moldura',

  'strip.spec': '{algorithm} · {digits} · {period}',
  'strip.digits': { one: '{n} dígito', many: '{n} dígitos', other: '{n} dígitos' },
  'strip.period': '{n} s',
  'strip.next': 'a seguir',
  'strip.seconds.abbr': 's',
  'strip.seconds.title': 'segundos',
  'strip.seconds.valid': 'válido',
  'strip.accountFallback': 'Conta {n}',
  'strip.copyAria': 'Copiar o código de {name}',
  'strip.copyAnnounce': 'Código {digits} copiado',
  'strip.copyFailedHint': 'A cópia falhou. Selecione o código na mão.',

  'fault.title': 'Linha ilegível',

  'vault.state.off': 'Desligado — nada é salvo',
  'vault.state.locked': 'Trancado — é preciso a frase secreta',
  'vault.state.open': 'Aberto — os secrets estão no campo de texto',
  'vault.explain':
    'Por padrão o Clockwork não salva nada. Se quiser, a entrada pode ficar aqui ' +
    'criptografada com uma frase secreta: PBKDF2-SHA-256 com {iterations} iterações e depois ' +
    'AES-256-GCM. Sem a frase secreta, o bloco salvo não vale nada.',
  'vault.pass.new': 'Nova frase secreta',
  'vault.pass.existing': 'Frase secreta',
  'vault.action.seal': 'Salvar criptografado',
  'vault.action.unseal': 'Abrir',
  'vault.action.deriving': 'Derivando a chave …',
  'vault.action.lock': 'Trancar',
  'vault.action.update': 'Salvar de novo',
  'vault.action.wipe': 'Apagar tudo',
  'vault.action.wipeConfirm': 'Apagar mesmo?',
  'vault.timeout.label': 'Tranca sozinho depois de',
  'vault.timeout.minutes': { one: '{n} minuto', many: '{n} minutos', other: '{n} minutos' },
  'vault.lockOnHide': 'e ao sair da aba',

  'vault.error.nothingToStore': 'Não há nada para salvar — o campo de texto está vazio.',
  'vault.error.storageBlocked': 'O navegador não permite salvar (modo privado?).',
  'vault.error.noVault': 'Não há nenhum cofre salvo.',
  'vault.error.noPassphrase': 'Sem frase secreta não há chave.',
  'vault.error.sealFailed': 'Não foi possível salvar.',
  'vault.error.unsealFailed': 'Não foi possível abrir.',

  'vault.msg.sealed': 'Cofre salvo criptografado.',
  'vault.msg.resealed': 'Cofre criptografado de novo.',
  'vault.msg.unsealed': 'Cofre aberto.',
  'vault.msg.locked': 'Cofre trancado.',
  'vault.msg.wiped': 'Cofre apagado.',
  'vault.msg.wipedNote': 'Apagado. Não sobrou nada no armazenamento.',
  'vault.locked.idle': {
    one: 'Trancado depois de {n} minuto sem entradas.',
    many: 'Trancado depois de {n} minutos sem entradas.',
    other: 'Trancado depois de {n} minutos sem entradas.',
  },
  'vault.locked.hidden': 'Trancado ao sair da aba.',

  'scan.noQr': 'Na imagem não dá para reconhecer nenhum código QR.',
  'scan.unreadable': 'Não foi possível ler a imagem — é mesmo uma imagem?',
  'scan.done': 'Código QR lido e inserido.',
  'scan.camera.unavailable':
    'Este ambiente não libera nenhuma câmera. Ao abrir o arquivo direto (file://) a maioria ' +
    'dos navegadores a bloqueia — “QR a partir de imagem” sempre funciona.',
  'scan.camera.denied':
    'A câmera foi negada. Redefina a permissão no navegador — ou use ' + '“QR a partir de imagem”.',
  'scan.camera.notFound':
    'Não há nenhuma câmera conectada. “QR a partir de imagem” funciona mesmo assim.',
  'scan.camera.busy': 'A câmera está sendo usada por outro programa.',
  'scan.camera.failed':
    'Não foi possível iniciar a câmera. “QR a partir de imagem” sempre funciona.',

  'import.done': {
    one: '{n} conta trazida da exportação do Google Authenticator',
    many: '{n} contas trazidas da exportação do Google Authenticator',
    other: '{n} contas trazidas da exportação do Google Authenticator',
  },
  'import.skipped': 'ignoradas: {list}',
  'import.skip.hotp': '{label} (HOTP, baseado em contador)',
  'import.skip.algorithm': '{label} (algoritmo não suportado)',
  'import.skip.emptySecret': '{label} (secret vazio)',
  'import.unnamed': 'Sem nome',
  'import.unreadable': 'Exportação ilegível.',

  'vacant.text':
    'Ainda não há nada. Coloque um secret acima — ou use {demo} para a chave de teste da ' +
    'RFC 4226.',
  'colophon.note': 'Sem rede · sem armazenamento · HMAC pela Web Crypto API',

  'lang.label': 'Idioma',
  'lang.aria': 'Escolher idioma',

  'demo.comment': '# Chave de teste da RFC 4226 — o secret é o texto “12345678901234567890”',
  'demo.label': 'Teste RFC',

  'err.base32.paddingInside': 'O caractere “=” só pode ficar no fim (não passa de preenchimento).',
  'err.base32.empty': 'A chave secret está vazia.',
  'err.base32.badChar':
    'Caractere inválido “{char}” na posição {position}. Base32 só conhece A–Z e 2–7 — os ' +
    'algarismos 0, 1 e 8 não aparecem (confundidos com O, I e B?).',
  'err.base32.badLength':
    'Comprimento inválido: {length} caracteres (sem espaços nem preenchimento). Base32 ' +
    'codifica 5 bytes em 8 caracteres; no último bloco só cabem 2, 4, 5, 7 ou 8 caracteres. ' +
    'Provavelmente falta um caractere ou há um a mais.',

  'err.uri.invalid': 'Isso não é uma URI válida. Espera-se “otpauth://totp/…”.',
  'err.uri.scheme': 'Esquema desconhecido “{scheme}”. Espera-se “otpauth”.',
  'err.uri.hotp':
    'Isso é uma URI HOTP (baseada em contador). Este aplicativo só gera códigos TOTP ' +
    'baseados no tempo — para o outro seria preciso guardar o estado do contador.',
  'err.uri.type': 'Tipo desconhecido “{type}”. Depois de “otpauth://” tem de vir “totp”.',
  'err.uri.typeEmpty': '(vazio)',
  'err.uri.noSecret': 'Falta o parâmetro “secret” na URI.',
  'err.uri.badLabel':
    'O rótulo da URI tem uma codificação por cento quebrada (por exemplo um “%” sozinho).',
  'err.uri.algorithm': 'Algoritmo desconhecido “{value}”. São suportados SHA1, SHA256 e SHA512.',
  'err.uri.digits': 'Valor inválido para “digits”: {value}. São permitidos de {min} a {max}.',
  'err.uri.period': 'Valor inválido para “period”: {value}. Esperam-se de 1 a 3600 segundos.',
  'err.uri.integer': 'O parâmetro “{name}” tem de ser um número inteiro; foi encontrado “{value}”.',

  'err.otp.digits': 'Número de dígitos inválido: {value}. São permitidos de {min} a {max}.',
  'err.otp.emptySecret': 'O secret está vazio — daí não dá para calcular nenhum código.',

  'err.line.unreadable': 'Não foi possível ler esta linha.',

  'err.vault.openFailed':
    'Não foi possível abrir o cofre. Frase secreta errada — ou os dados salvos foram ' +
    'alterados.',
  'err.vault.badFormat': 'Os dados salvos do cofre estão num formato desconhecido.',
  'err.vault.version': 'A versão {version} do cofre não é suportada (esperada: {expected}).',
  'err.vault.base64': 'O campo “{field}” dos dados do cofre não é Base64 válido.',
  'err.vault.iterations': 'Número de iterações inválido: {value}.',

  'err.migration.notExport':
    'Isso não é uma exportação do Google Authenticator. Espera-se ' +
    '“otpauth-migration://offline?data=…”.',
  'err.migration.noData': 'Falta o parâmetro “data” na URI.',
  'err.migration.badPercent': 'O parâmetro “data” tem uma codificação por cento quebrada.',
  'err.migration.badBase64': 'O parâmetro “data” não é Base64 válido.',
  'err.migration.noAccounts': 'Nesta exportação não há nenhuma conta.',
} satisfies Strings;
