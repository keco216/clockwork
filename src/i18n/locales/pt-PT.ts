/**
 * Português (Portugal).
 *
 * Glossário: secret · cofre (vault) · conta · frase-passe (passphrase) ·
 *   entrada · código · mostrador. Vocabulário europeu: separador (não « aba »),
 *   câmara (não « câmera »), ficheiro, guardar (não « salvar »).
 * Registo: impessoal e sóbrio, como nas ferramentas para programadores.
 * Aspas: « … », o uso tipográfico português.
 * Plural: CLDR dá one/many/other; « many » só afeta números enormes e repete o
 *   texto de « other ».
 */

import type { Strings } from '../strings';

export default {
  'meta.title': 'Clockwork — Autenticador TOTP',
  'meta.description':
    'Clockwork — autenticador TOTP. Gera códigos de dois fatores inteiramente no navegador, ' +
    'sem qualquer pedido de rede.',
  'brand.tagline': 'Autenticador TOTP · RFC 6238',
  'skip.toCodes': 'Ir para os códigos',

  'status.line': '{connection} · {vault}',
  'status.offline': 'Sem ligação',
  'status.vault.off': 'nada é guardado',
  'status.vault.locked': 'cofre trancado',
  'status.vault.open': 'cofre aberto',

  'zone.input': 'Entrada',
  'zone.vault': 'Cofre',
  'zone.codes': 'Códigos',

  'input.legend': 'Uma entrada por linha',
  'input.help.formats': 'Base32, {nameSecret} ou {uri} — misturados. {hash} inicia uma nota.',
  'input.help.images':
    'As imagens com código QR também podem ser arrastadas para aqui ou coladas com {paste}.',
  'input.help.migration':
    'As exportações do Google Authenticator ({migration}) são convertidas automaticamente.',
  'shortcut.modifier': 'Ctrl',

  'input.count.accounts': { one: '{n} conta', many: '{n} contas', other: '{n} contas' },
  'input.count.errors': { one: '{n} erro', many: '{n} erros', other: '{n} erros' },
  'input.count.join': '{accounts} · {errors}',

  'key.clear': 'Esvaziar',
  'key.qrImage': 'QR a partir de imagem',
  'key.camera': 'Câmara',
  'key.cameraStop': 'Desligar câmara',
  'key.copy': 'Copiar',
  'key.copyDone': 'Copiado',
  'key.copyFailed': 'Falhou',

  'viewfinder.hint': 'Mantenha o código QR dentro da moldura',

  'strip.spec': '{algorithm} · {digits} · {period}',
  'strip.digits': { one: '{n} dígito', many: '{n} dígitos', other: '{n} dígitos' },
  'strip.period': '{n} s',
  'strip.next': 'segue',
  'strip.seconds.abbr': 's',
  'strip.seconds.title': 'segundos',
  'strip.seconds.valid': 'válido',
  'strip.accountFallback': 'Conta {n}',
  'strip.copyAria': 'Copiar o código de {name}',
  'strip.copyAnnounce': 'Código {digits} copiado',
  'strip.copyFailedHint': 'A cópia falhou. Selecione o código à mão.',

  'fault.title': 'Linha ilegível',

  'vault.state.off': 'Desligado — nada é guardado',
  'vault.state.locked': 'Trancado — é precisa a frase-passe',
  'vault.state.open': 'Aberto — os secrets estão no campo de texto',
  'vault.explain':
    'Por predefinição o Clockwork não guarda nada. Se quiser, a entrada pode ficar aqui ' +
    'cifrada com uma frase-passe: PBKDF2-SHA-256 com {iterations} iterações e depois ' +
    'AES-256-GCM. Sem a frase-passe, o bloco guardado não vale nada.',
  'vault.pass.new': 'Nova frase-passe',
  'vault.pass.existing': 'Frase-passe',
  'vault.action.seal': 'Guardar cifrado',
  'vault.action.unseal': 'Abrir',
  'vault.action.deriving': 'A derivar a chave …',
  'vault.action.lock': 'Trancar',
  'vault.action.update': 'Guardar de novo',
  'vault.action.wipe': 'Apagar tudo',
  'vault.action.wipeConfirm': 'Apagar mesmo?',
  'vault.timeout.label': 'Tranca sozinho ao fim de',
  'vault.timeout.minutes': { one: '{n} minuto', many: '{n} minutos', other: '{n} minutos' },
  'vault.lockOnHide': 'e ao sair do separador',

  'vault.error.nothingToStore': 'Não há nada para guardar — o campo de texto está vazio.',
  'vault.error.storageBlocked': 'O navegador não permite guardar (modo privado?).',
  'vault.error.noVault': 'Não há nenhum cofre guardado.',
  'vault.error.noPassphrase': 'Sem frase-passe não há chave.',
  'vault.error.sealFailed': 'Não foi possível guardar.',
  'vault.error.unsealFailed': 'Não foi possível abrir.',

  'vault.msg.sealed': 'Cofre guardado cifrado.',
  'vault.msg.resealed': 'Cofre cifrado de novo.',
  'vault.msg.unsealed': 'Cofre aberto.',
  'vault.msg.locked': 'Cofre trancado.',
  'vault.msg.wiped': 'Cofre apagado.',
  'vault.msg.wipedNote': 'Apagado. Já não fica nada no armazenamento.',
  'vault.locked.idle': {
    one: 'Trancado ao fim de {n} minuto sem entradas.',
    many: 'Trancado ao fim de {n} minutos sem entradas.',
    other: 'Trancado ao fim de {n} minutos sem entradas.',
  },
  'vault.locked.hidden': 'Trancado ao sair do separador.',

  'scan.noQr': 'Na imagem não se reconhece nenhum código QR.',
  'scan.unreadable': 'Não foi possível ler a imagem — é mesmo uma imagem?',
  'scan.done': 'Código QR lido e inserido.',
  'scan.camera.unavailable':
    'Este ambiente não disponibiliza nenhuma câmara. Ao abrir o ficheiro diretamente ' +
    '(file://) a maioria dos navegadores bloqueia-a — « QR a partir de imagem » funciona ' +
    'sempre.',
  'scan.camera.denied':
    'A câmara foi recusada. Reponha a permissão no navegador — ou use ' +
    '« QR a partir de imagem ».',
  'scan.camera.notFound':
    'Não há nenhuma câmara ligada. « QR a partir de imagem » funciona à mesma.',
  'scan.camera.busy': 'A câmara está a ser usada por outro programa.',
  'scan.camera.failed':
    'Não foi possível iniciar a câmara. « QR a partir de imagem » funciona sempre.',

  'import.done': {
    one: '{n} conta retirada da exportação do Google Authenticator',
    many: '{n} contas retiradas da exportação do Google Authenticator',
    other: '{n} contas retiradas da exportação do Google Authenticator',
  },
  'import.skipped': 'ignoradas: {list}',
  'import.skip.hotp': '{label} (HOTP, baseado em contador)',
  'import.skip.algorithm': '{label} (algoritmo não suportado)',
  'import.skip.emptySecret': '{label} (secret vazio)',
  'import.unnamed': 'Sem nome',
  'import.unreadable': 'Exportação ilegível.',

  'vacant.text': 'Ainda não há nada. Ponha um secret acima.',
  'colophon.note': 'Sem rede · sem armazenamento · HMAC através da Web Crypto API',

  'lang.label': 'Idioma',
  'lang.aria': 'Escolher idioma',

  'err.base32.paddingInside': 'O carácter « = » só pode estar no fim (não passa de enchimento).',
  'err.base32.empty': 'A chave secret está vazia.',
  'err.base32.badChar':
    'Carácter inválido « {char} » na posição {position}. Base32 só conhece A–Z e 2–7 — os ' +
    'algarismos 0, 1 e 8 não aparecem (confundidos com O, I e B?).',
  'err.base32.badLength':
    'Comprimento inválido: {length} caracteres (sem espaços nem enchimento). Base32 codifica ' +
    '5 bytes em 8 caracteres; no último bloco só cabem 2, 4, 5, 7 ou 8 caracteres. ' +
    'Provavelmente falta um carácter ou há um a mais.',

  'err.uri.invalid': 'Isto não é um URI válido. Espera-se « otpauth://totp/… ».',
  'err.uri.scheme': 'Esquema desconhecido « {scheme} ». Espera-se « otpauth ».',
  'err.uri.hotp':
    'Isto é um URI HOTP (baseado em contador). Esta aplicação só gera códigos TOTP baseados ' +
    'no tempo — para o outro seria preciso guardar o estado do contador.',
  'err.uri.type': 'Tipo desconhecido « {type} ». A seguir a « otpauth:// » tem de vir « totp ».',
  'err.uri.typeEmpty': '(vazio)',
  'err.uri.noSecret': 'Falta o parâmetro « secret » no URI.',
  'err.uri.badLabel':
    'A etiqueta do URI tem uma codificação por cento estragada (por exemplo um « % » ' +
    'sozinho).',
  'err.uri.algorithm': 'Algoritmo desconhecido « {value} ». São suportados SHA1, SHA256 e SHA512.',
  'err.uri.digits': 'Valor inválido para « digits »: {value}. São permitidos de {min} a {max}.',
  'err.uri.period': 'Valor inválido para « period »: {value}. Esperam-se de 1 a 3600 segundos.',
  'err.uri.integer':
    'O parâmetro « {name} » tem de ser um número inteiro; foi encontrado « {value} ».',

  'err.otp.digits': 'Número de dígitos inválido: {value}. São permitidos de {min} a {max}.',
  'err.otp.emptySecret': 'O secret está vazio — daí não se pode calcular nenhum código.',

  'err.line.unreadable': 'Não foi possível ler esta linha.',

  'err.vault.openFailed':
    'Não foi possível abrir o cofre. Frase-passe errada — ou os dados guardados foram ' +
    'alterados.',
  'err.vault.badFormat': 'Os dados guardados do cofre têm um formato desconhecido.',
  'err.vault.version': 'A versão {version} do cofre não é suportada (esperada: {expected}).',
  'err.vault.base64': 'O campo « {field} » dos dados do cofre não é Base64 válido.',
  'err.vault.iterations': 'Número de iterações inválido: {value}.',

  'err.migration.notExport':
    'Isto não é uma exportação do Google Authenticator. Espera-se ' +
    '« otpauth-migration://offline?data=… ».',
  'err.migration.noData': 'Falta o parâmetro « data » no URI.',
  'err.migration.badPercent': 'O parâmetro « data » tem uma codificação por cento estragada.',
  'err.migration.badBase64': 'O parâmetro « data » não é Base64 válido.',
  'err.migration.noAccounts': 'Nesta exportação não há contas nenhumas.',
} satisfies Strings;
