import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  BookOpen, 
  Search, 
  ShieldAlert, 
  Compass, 
  KeyRound, 
  ShieldCheck, 
  EyeOff, 
  Lock, 
  ChevronDown, 
  Info, 
  Cpu, 
  Layers, 
  Clock, 
  FileCheck2,
  Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FAQItem {
  id: string;
  category: 'general' | 'auth' | 'sealing' | 'sharing' | 'limits';
  icon: React.ComponentType<any>;
  questionEs: string;
  questionEn: string;
  answerEs: React.ReactNode;
  answerEn: React.ReactNode;
}

export const WikiView: React.FC = () => {
  const { language } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', labelEs: 'Todo', labelEn: 'All' },
    { id: 'general', labelEs: 'General y Funcionamiento', labelEn: 'General & Mechanics' },
    { id: 'auth', labelEs: 'Identidad y Acceso', labelEn: 'Identity & Access' },
    { id: 'sealing', labelEs: 'Sellado y Criptografía', labelEn: 'Sealing & Cryptography' },
    { id: 'sharing', labelEs: 'Enlaces y Destrucción', labelEn: 'Links & Self-Destruction' },
    { id: 'limits', labelEs: 'Alcances y Límites', labelEn: 'Scope & Limits' },
  ];

  const faqs: FAQItem[] = [
    {
      id: 'what-is-viewq',
      category: 'general',
      icon: Compass,
      questionEs: '¿Qué es viewQ y cómo funciona su arquitectura híbrida?',
      questionEn: 'What is viewQ and how does its hybrid architecture work?',
      answerEs: (
        <div className="space-y-3 leading-relaxed text-gray-600 text-xs md:text-sm">
          <p>
            <strong>viewQ</strong> es una plataforma de software diseñada para fiscalías, peritos y tribunales de justicia que automatiza la preservación, autenticación y transferencia segura de evidencia digital sensible.
          </p>
          <p>
            Funciona mediante un modelo criptográfico híbrido que unifica tres capas tecnológicas de vanguardia:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <strong className="text-gray-900">1. Criptografía Poscuántica (PQC):</strong> Implementa el estándar nacional de EE.UU. <strong>NIST ML-KEM-768</strong> (derivado de Kyber) para encapsular claves simétricas, blindando los expedientes contra ataques de futuros ordenadores cuánticos (amenaza <i>Y2Q</i> o algoritmo de Shor).
            </li>
            <li>
              <strong className="text-gray-900">2. Entropía Física Real (QRNG):</strong> Utiliza superposición cuántica real mediante las QPUs de <strong>IonQ</strong> (procesadores de iones atrapados de bario e ytterbium) para generar semillas y vectores aleatorios infranqueables, eliminando la debilidad inherente de los generadores pseudo-aleatorios de software tradicionales.
            </li>
            <li>
              <strong className="text-gray-900">3. Notarización Blockchain (Stellar):</strong> Registra una huella digital irreversible (SHA3-256) de la evidencia directamente en el ledger inmutable de la red <strong>Stellar</strong>. Esto asegura que la fecha, hora, autoría y bytes exactos del archivo queden certificados de por vida sin posibilidad de alteración.
            </li>
          </ul>
        </div>
      ),
      answerEn: (
        <div className="space-y-3 leading-relaxed text-gray-600 text-xs md:text-sm">
          <p>
            <strong>viewQ</strong> is a software platform designed for prosecutors, forensic experts, and courts that automates the preservation, authentication, and secure transfer of sensitive digital evidence.
          </p>
          <p>
            It operates under a hybrid cryptographic model unifying three cutting-edge technological pillars:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <strong className="text-gray-900">1. Post-Quantum Cryptography (PQC):</strong> Implements the US national standard <strong>NIST ML-KEM-768</strong> (derived from Kyber) to encapsulate symmetric keys, shielding files from attacks by future quantum computers (the <i>Y2Q</i> threat or Shor's algorithm).
            </li>
            <li>
              <strong className="text-gray-900">2. True Physical Entropy (QRNG):</strong> Harnesses physical quantum superposition through <strong>IonQ QPUs</strong> (trapped-ion barium/ytterbium processors) to generate uncrackable seeds and random vectors, removing the inherent weakness of traditional software-based pseudo-random generators.
            </li>
            <li>
              <strong className="text-gray-900">3. Blockchain Notarization (Stellar):</strong> Records an irreversible cryptographic digest (SHA3-256) of the evidence directly onto the immutable <strong>Stellar</strong> ledger. This certifies the exact timestamp, authorship, and bytes of the file for life, making alteration impossible.
            </li>
          </ul>
        </div>
      )
    },
    {
      id: 'security-auth-registration',
      category: 'auth',
      icon: KeyRound,
      questionEs: '¿Por qué el inicio de sesión y registro son seguros desde el primer momento?',
      questionEn: 'Why is the login and registration process secure from the very start?',
      answerEs: (
        <div className="space-y-3 leading-relaxed text-gray-600 text-xs md:text-sm">
          <p>
            La autenticación tradicional mediante correos y contraseñas simples es altamente vulnerable a ataques de phishing, fuerza bruta o filtración de bases de datos. En viewQ no existen contraseñas convencionales en un servidor central. Todo se asegura desde el cliente utilizando dos alternativas cuánticamente blindadas:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div className="p-3 bg-gray-50 border border-[#eaeaea] rounded-sm">
              <span className="font-mono text-[9px] font-bold text-gray-900 block uppercase mb-1">A. PASSKEYS BIOMÉTRICOS</span>
              <p className="text-xs">
                Utiliza el estándar FIDO2/WebAuthn de tu sistema operativo. Al iniciar sesión, tu dispositivo realiza una firma criptográfica utilizando una llave privada almacenada en su chip de hardware seguro (Secure Enclave). Tus datos biométricos (rostro, huella) nunca viajan por internet; solo validan localmente la autorización.
              </p>
            </div>
            <div className="p-3 bg-gray-50 border border-[#eaeaea] rounded-sm">
              <span className="font-mono text-[9px] font-bold text-gray-900 block uppercase mb-1">B. DICEWARE FÍSICO</span>
              <p className="text-xs">
                Si prefieres frase de acceso, generamos una secuencia indestructible de 5 palabras aleatorias. A diferencia de otros sistemas, estas palabras se eligen utilizando la entropía física real de la QPU de IonQ. Esto garantiza que nadie más en el universo pueda predecir o regenerar tu frase.
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            ✓ <strong>Privacidad Absoluta:</strong> La identidad del fiscal o perito se asocia mediante hash local, impidiendo rastreos centralizados de la actividad judicial.
          </p>
        </div>
      ),
      answerEn: (
        <div className="space-y-3 leading-relaxed text-gray-600 text-xs md:text-sm">
          <p>
            Traditional authentication with simple emails and passwords is highly vulnerable to phishing, brute-force attacks, or central database leaks. In viewQ, there are no traditional passwords stored on a central server. Everything is secured from the client side using two quantum-shielded alternatives:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div className="p-3 bg-gray-50 border border-[#eaeaea] rounded-sm">
              <span className="font-mono text-[9px] font-bold text-gray-900 block uppercase mb-1">A. BIOMETRIC PASSKEYS</span>
              <p className="text-xs">
                Leverages your operating system's FIDO2/WebAuthn standard. When you log in, your device performs a cryptographic signature using a private key stored inside its Secure Enclave hardware chip. Your biometric data (face or fingerprint) never travels over the internet; it only authorizes the signature locally.
              </p>
            </div>
            <div className="p-3 bg-gray-50 border border-[#eaeaea] rounded-sm">
              <span className="font-mono text-[9px] font-bold text-gray-900 block uppercase mb-1">B. PHYSICAL DICEWARE</span>
              <p className="text-xs">
                If you opt for a recovery phrase, we generate an indestructible sequence of 5 random words. Unlike other generators, these words are selected using physical quantum entropy directly from IonQ's trapped-ion QPU, making it mathematically impossible for anyone to guess or replicate.
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            ✓ <strong>Absolute Privacy:</strong> The prosecutor or expert's identity is mapped locally via cryptographic hashes, preventing centralized tracing of judicial workflows.
          </p>
        </div>
      )
    },
    {
      id: 'quantum-sealing-process',
      category: 'sealing',
      icon: Lock,
      questionEs: '¿Cómo funciona exactamente el Sellado de Evidencias y la inmutabilidad en Stellar?',
      questionEn: 'How does Evidence Sealing and Stellar blockchain immutability work?',
      answerEs: (
        <div className="space-y-3 leading-relaxed text-gray-600 text-xs md:text-sm">
          <p>
            Cuando cargas una prueba (documento confidencial, PDF, imagen pericial) y haces clic en "Iniciar Sellado Cuántico", se activa un sofisticado pipeline en tu navegador web:
          </p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              <strong className="text-gray-900">Generación de Claves Simétricas:</strong> Se solicita un bloque de bits aleatorios con entropía física a la QPU IonQ (QRNG) para inicializar una clave secreta de cifrado AES-256-GCM y un Vector de Inicialización (IV).
            </li>
            <li>
              <strong className="text-gray-900">Cifrado Local:</strong> La evidencia se encripta de forma local en tu navegador. Los datos legibles de tu expediente nunca salen de tu computadora sin encriptar.
            </li>
            <li>
              <strong className="text-gray-900">Encapsulación Poscuántica ML-KEM-768:</strong> La clave simétrica de cifrado se encapsula utilizando un par de llaves asimétricas poscuánticas generadas bajo la formulación matemática de redes matemáticas estructuradas de ML-KEM.
            </li>
            <li>
              <strong className="text-gray-900">Notarización en Stellar:</strong> Se calcula la huella hash SHA3-256 inalterable del archivo completo original y cifrado. Esta huella se codifica en un campo especial de transacción de Stellar (Memo Hash). Al confirmarse en el ledger, la transacción queda timbrada con fecha y hora inmutables por consenso descentralizado.
            </li>
          </ol>
          <p className="text-xs bg-emerald-50 text-emerald-800 p-2.5 rounded-sm border border-emerald-100">
            <strong>Resultado:</strong> Descargas un archivo contenedor especial <code>.viewq</code> que contiene el criptograma, las claves encapsuladas y los metadatos. Cualquier alteración posterior de un solo bit en este archivo será detectada inmediatamente al auditar el archivo en la pestaña "Verificador Forense".
          </p>
        </div>
      ),
      answerEn: (
        <div className="space-y-3 leading-relaxed text-gray-600 text-xs md:text-sm">
          <p>
            When you load an evidence file (confidential text, PDF, forensic image) and click "Start Quantum Sealing", a highly secure pipeline initiates directly inside your browser:
          </p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              <strong className="text-gray-900">Symmetric Key Generation:</strong> A block of truly random physical bits is requested from IonQ's trapped-ion QPU (QRNG) to initialize an AES-256-GCM encryption key and an Initialization Vector (IV).
            </li>
            <li>
              <strong className="text-gray-900">Client-Side Encryption:</strong> The evidence is encrypted locally. Legible bytes of your file never leave your local system in plaintext.
            </li>
            <li>
              <strong className="text-gray-900">ML-KEM-768 Post-Quantum Encapsulation:</strong> The symmetric AES key is encapsulated using asymmetric post-quantum public/private key pairs built over structured lattices, according to the NIST ML-KEM standard.
            </li>
            <li>
              <strong className="text-gray-900">Stellar Notarization:</strong> An irreversible SHA3-256 hash of both the original and encrypted files is calculated. This hash is embedded into a Stellar blockchain transaction as a Memo Hash. Once confirmed, the transaction becomes an eternal, unalterable digital receipt.
            </li>
          </ol>
          <p className="text-xs bg-emerald-50 text-emerald-800 p-2.5 rounded-sm border border-emerald-100">
            <strong>Outcome:</strong> You receive a sealed container file <code>.viewq</code> that holds the ciphertext, encapsulated key metadata, and parameters. Any modification to a single bit of this file will trigger an immediate failure warning during "Forensic Verification".
          </p>
        </div>
      )
    },
    {
      id: 'viewq-vs-webq-extension',
      category: 'sealing',
      icon: FileCheck2,
      questionEs: '¿Cuál es la diferencia entre las extensiones de archivo .viewq y .webq?',
      questionEn: 'What is the difference between .viewq and .webq file extensions?',
      answerEs: (
        <div className="space-y-3 leading-relaxed text-gray-600 text-xs md:text-sm">
          <p>
            Ambas extensiones pertenecen al ecosistema de preservación criptográfica poscuántica de la plataforma, pero cumplen roles complementarios:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-gray-900">Extensión <code>.viewq</code> (Sealed Container):</strong> Es el archivo contenedor que guarda la evidencia original completamente cifrada con AES-256-GCM y contiene los metadatos del anclaje poscuántico ML-KEM-768. Es ideal para el almacenamiento de larga duración, traslado judicial y auditoría de inmutabilidad en Stellar.
            </li>
            <li>
              <strong className="text-gray-900">Extensión <code>.webq</code> (Web-Quantum Credential):</strong> Es un formato de firma electrónica e intercambio liviano optimizado para navegadores web estándar. Permite autorizar, verificar firmas y decapsular claves simétricas en caliente a través de micro-librerías en JS sin necesidad de hardware o clientes de escritorio pesados, facilitando el acceso inmediato y seguro desde terminales forenses remotos.
            </li>
          </ul>
        </div>
      ),
      answerEn: (
        <div className="space-y-3 leading-relaxed text-gray-600 text-xs md:text-sm">
          <p>
            Both extensions belong to the platform's post-quantum cryptographic ecosystem, serving complementary roles:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-gray-900"><code>.viewq</code> Extension (Sealed Container):</strong> The core container file storing the evidence fully encrypted via AES-256-GCM along with ML-KEM-768 post-quantum metadata. It is built for long-term storage, judicial transport, and immutability auditing on Stellar.
            </li>
            <li>
              <strong className="text-gray-900"><code>.webq</code> Extension (Web-Quantum Credential):</strong> A lightweight electronic signature and exchange format optimized for standard web browsers. It enables on-the-fly verification and symmetric key decapsulation using pure JS micro-libraries without requiring specialized hardware or heavy desktop clients, facilitating secure instant access from remote forensic endpoints.
            </li>
          </ul>
        </div>
      )
    },
    {
      id: 'ephemeral-sharing-security',
      category: 'sharing',
      icon: EyeOff,
      questionEs: '¿Cómo funciona la seguridad de los Enlaces Efímeros y la captura forense silenciosa?',
      questionEn: 'How does the security of Ephemeral Links and silent forensic capture work?',
      answerEs: (
        <div className="space-y-3 leading-relaxed text-gray-600 text-xs md:text-sm">
          <p>
            Compartir expedientes confidenciales con terceros (defensores, jueces, peritos externos) es un punto de fuga crítico. El módulo de <strong>Enlaces Efímeros (Burn-after-Reading)</strong> soluciona esto garantizando que los datos se autodestruyan inmediatamente tras ser abiertos por primera vez:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-gray-900">Criptografía Efímera:</strong> Al compartir, el contenido se vuelve a cifrar con un token QRNG único. La clave de descifrado viaja de forma segura únicamente en el fragmento hash de la URL (por ejemplo, <code>#key=...</code>), lo que significa que el servidor o intermediarios de red nunca tienen acceso a la clave, ya que los navegadores no envían el fragmento hash al servidor.
            </li>
            <li>
              <strong className="text-gray-900">Autodestrucción Garantizada:</strong> El receptor accede o abre el enlace. En ese milisegundo exacto, el servidor marca el token como consumido en la base de datos de Stellar o local y borra definitivamente el criptograma del repositorio. No hay segundas lecturas.
            </li>
            <li>
              <strong className="text-gray-900">Auditoría Forense Silenciosa:</strong> Mientras el archivo se descifra en el navegador del receptor, viewQ captura de forma automatizada los metadatos de acceso (Dirección IP, agente de usuario del dispositivo, sistema operativo, resolución de pantalla y geolocalización aproximada). Estos datos se empaquetan en una huella digital que queda notarizada de manera permanente e inalterable en Stellar. Si un enlace fue consumido, el creador puede verificar exactamente cuándo y quién lo abrió primero.
            </li>
          </ul>
        </div>
      ),
      answerEn: (
        <div className="space-y-3 leading-relaxed text-gray-600 text-xs md:text-sm">
          <p>
            Sharing confidential files with third parties (defenders, judges, external experts) is a critical leak vector. The <strong>Ephemeral Shared Links (Burn-after-Reading)</strong> module solves this by guaranteeing that data immediately self-destructs upon its first view:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-gray-900">Ephemeral Cryptography:</strong> When sharing, the file content is re-encrypted with a unique QRNG token. The decryption key is passed solely through the URL hash fragment (e.g., <code>#key=...</code>). Because browsers do not transmit URL hashes to servers, network nodes or hosts never touch the decryption key.
            </li>
            <li>
              <strong className="text-gray-900">Guaranteed Self-Destruction:</strong> When the recipient opens the link, the token is instantly flagged as consumed on the ledger/database and the ciphertext is permanently purged. No secondary openings are allowed.
            </li>
            <li>
              <strong className="text-gray-900">Silent Forensic Capture:</strong> While decryption happens on the recipient's browser, viewQ automatically captures technical metadata (IP address, device user-agent, operating system, screen resolution, and estimated location). These details are packed into a digital fingerprint and permanently notarized on Stellar. If a link is consumed, the sender can inspect exactly when and who opened it.
            </li>
          </ul>
        </div>
      )
    },
    {
      id: 'system-scopes-and-limits',
      category: 'limits',
      icon: ShieldAlert,
      questionEs: '¿Cuáles son los alcances, limitaciones y el modo de operación virtual de la plataforma?',
      questionEn: 'What are the scope, limitations, and virtual equivalent mode of the platform?',
      answerEs: (
        <div className="space-y-3 leading-relaxed text-gray-600 text-xs md:text-sm">
          <p>
            Es importante comprender los límites periciales y de diseño de viewQ para asegurar su uso óptimo:
          </p>
          <div className="space-y-2.5">
            <div className="flex gap-2">
              <span className="text-xs bg-[#f59e0b]/10 text-[#f59e0b] px-2 py-0.5 rounded-sm font-mono font-bold h-fit flex-shrink-0">LÍMITE DE TAMAÑO</span>
              <p className="text-xs text-gray-600">
                La carga de archivos está recomendada hasta <strong>10MB</strong>. Esto se debe a que todo el procesamiento criptográfico de cifrado AES y encapsulación poscuántica se realiza directamente en la memoria RAM del navegador cliente para evitar fugas, y archivos muy grandes pueden ralentizar el navegador.
              </p>
            </div>
            
            <div className="flex gap-2">
              <span className="text-xs bg-[#f59e0b]/10 text-[#f59e0b] px-2 py-0.5 rounded-sm font-mono font-bold h-fit flex-shrink-0">PROCESAMIENTO VIRTUAL</span>
              <p className="text-xs text-gray-600">
                Si no cuentas con credenciales pagadas de la API de IonQ o saldo de lumens de Stellar, la plataforma opera por defecto en <strong>Modo de Coprocesador Virtual QPU y Testnet de Stellar</strong>. El motor virtual reproduce matemáticamente las matrices de superposición cuántica para fines didácticos y de auditoría interna, mientras que la red de prueba de Stellar consolida el anclaje real sin incurrir en costos de producción.
              </p>
            </div>

            <div className="flex gap-2">
              <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-sm font-mono font-bold h-fit flex-shrink-0">BÓVEDA LOCAL</span>
              <p className="text-xs text-gray-600">
                Por motivos de confidencialidad judicial estricta, viewQ almacena la bitácora de evidencias registradas localmente en tu navegador web. Si borras las cookies, el historial o la caché del navegador, la bitácora local de registros podría reiniciarse, aunque los expedientes <code>.viewq</code> descargados y las firmas notarizadas en el ledger de Stellar seguirán siendo perfectamente válidos de manera permanente.
              </p>
            </div>
          </div>
        </div>
      ),
      answerEn: (
        <div className="space-y-3 leading-relaxed text-gray-600 text-xs md:text-sm">
          <p>
            It is critical to understand viewQ's design and forensic boundaries to ensure optimal operational performance:
          </p>
          <div className="space-y-2.5">
            <div className="flex gap-2">
              <span className="text-xs bg-[#f59e0b]/10 text-[#f59e0b] px-2 py-0.5 rounded-sm font-mono font-bold h-fit flex-shrink-0">SIZE LIMIT</span>
              <p className="text-xs text-gray-600">
                The recommended file size limit is <strong>10MB</strong>. Because all AES-GCM and post-quantum key encapsulation calculations run directly within the client browser's RAM to prevent leakage, larger files can cause browser lag or memory constraints.
              </p>
            </div>
            
            <div className="flex gap-2">
              <span className="text-xs bg-[#f59e0b]/10 text-[#f59e0b] px-2 py-0.5 rounded-sm font-mono font-bold h-fit flex-shrink-0">VIRTUAL COPROCESSOR</span>
              <p className="text-xs text-gray-600">
                If no paid IonQ API key or funded Stellar secret is supplied, the application defaults to a highly-robust <strong>QPU Virtual Coprocessor and Stellar Testnet integration</strong>. The virtual engine models qubit superposition matrices for compliance testing, and the testnet handles block anchorings for free.
              </p>
            </div>

            <div className="flex gap-2">
              <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-sm font-mono font-bold h-fit flex-shrink-0">LOCAL VAULT</span>
              <p className="text-xs text-gray-600">
                To guarantee strict judicial privacy, viewQ keeps your evidence catalog locally in browser storage. If you clear cookies, history, or site storage, your list of registered items may clear. However, downloaded <code>.viewq</code> archive files and their notarized hashes on the Stellar ledger remain eternally and globally verifiable.
              </p>
            </div>
          </div>
        </div>
      )
    }
  ];

  const filteredFaqs = faqs.filter(faq => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      faq.questionEs.toLowerCase().includes(q) ||
      faq.questionEn.toLowerCase().includes(q) ||
      faq.id.toLowerCase().includes(q);
    
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Title Header */}
      <div className="border-b border-[#eaeaea] pb-5">
        <div className="flex items-center gap-2.5">
          <BookOpen size={24} className="text-black" />
          <h1 className="font-sans font-semibold tracking-tight text-2xl text-[#111111]" id="wiki-title">
            {language === 'es' ? 'Preguntas Frecuentes y Wiki' : 'Frequently Asked Questions & Wiki'}
          </h1>
        </div>
        <p className="text-sm text-gray-500 mt-1 leading-relaxed">
          {language === 'es' 
            ? 'Aprenda sobre el pipeline de protección, el cifrado híbrido poscuántico ML-KEM-768, la inmutabilidad de Stellar y las características de seguridad desde el login hasta el fin del ciclo de los enlaces.'
            : 'Learn about the protection pipeline, ML-KEM-768 hybrid post-quantum encryption, Stellar immutability, and security features from login to link destruction.'}
        </p>
      </div>

      {/* Quick Security Pillars Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#eaeaea] p-4 rounded-sm shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] font-bold text-gray-400 uppercase tracking-widest">
              {language === 'es' ? 'CRIPTOGRAFÍA' : 'CRYPTOGRAPHY'}
            </span>
            <Lock size={15} className="text-blue-500" />
          </div>
          <div>
            <h4 className="font-sans font-bold text-[11px] text-gray-900 uppercase">ML-KEM-768 (Kyber)</h4>
            <p className="text-[10px] text-gray-500 leading-normal mt-0.5">
              {language === 'es' 
                ? 'Protección hermética a nivel matemático resistente a futuros ataques cuánticos.'
                : 'Watertight mathematical protection resistant to future quantum computing decryption.'}
            </p>
          </div>
        </div>

        <div className="bg-white border border-[#eaeaea] p-4 rounded-sm shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] font-bold text-gray-400 uppercase tracking-widest">
              {language === 'es' ? 'ENTROPÍA FÍSICA' : 'PHYSICAL ENTROPY'}
            </span>
            <Cpu size={15} className="text-purple-500" />
          </div>
          <div>
            <h4 className="font-sans font-bold text-[11px] text-gray-900 uppercase">IonQ QRNG Core</h4>
            <p className="text-[10px] text-gray-500 leading-normal mt-0.5">
              {language === 'es' 
                ? 'Semillas aleatorias creadas mediante superposición física de iones de Ytterbium.'
                : 'True random seeds generated using physical superposition of Ytterbium ions.'}
            </p>
          </div>
        </div>

        <div className="bg-white border border-[#eaeaea] p-4 rounded-sm shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] font-bold text-gray-400 uppercase tracking-widest">
              {language === 'es' ? 'INMUTABILIDAD' : 'IMMUTABILITY'}
            </span>
            <Layers size={15} className="text-emerald-500" />
          </div>
          <div>
            <h4 className="font-sans font-bold text-[11px] text-gray-900 uppercase">Stellar Ledger</h4>
            <p className="text-[10px] text-gray-500 leading-normal mt-0.5">
              {language === 'es' 
                ? 'Notarización inalterable con marca temporal exacta y hash SHA3 en cadena de bloques.'
                : 'Immutable notarization with exact timestamp and SHA3 hash on decentralized blockchain.'}
            </p>
          </div>
        </div>

        <div className="bg-white border border-[#eaeaea] p-4 rounded-sm shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] font-bold text-gray-400 uppercase tracking-widest">
              {language === 'es' ? 'TRANSFERENCIA' : 'TRANSFER'}
            </span>
            <Share2 size={15} className="text-rose-500" />
          </div>
          <div>
            <h4 className="font-sans font-bold text-[11px] text-gray-900 uppercase">One-Time Burning</h4>
            <p className="text-[10px] text-gray-500 leading-normal mt-0.5">
              {language === 'es' 
                ? 'Enlaces que se autodestruyen al abrirse y capturan la huella forense de acceso.'
                : 'Links that instantly self-destruct upon view and capture client forensic fingerprints.'}
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search controls */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'es' ? 'Buscar preguntas o conceptos en la wiki...' : 'Search questions or concepts in the wiki...'}
              className="w-full text-xs font-sans pl-10 pr-4 py-3.5 rounded-sm border border-[#eaeaea] bg-white text-[#111111] focus:outline-none focus:border-black transition-all"
            />
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-[#fafafa]">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 text-[10px] font-sans font-bold uppercase tracking-wider rounded-sm transition-all whitespace-nowrap cursor-pointer ${
                  isSelected 
                    ? 'bg-black text-white' 
                    : 'bg-white text-gray-500 border border-[#eaeaea] hover:text-black hover:border-gray-400'
                }`}
              >
                {language === 'es' ? cat.labelEs : cat.labelEn}
              </button>
            );
          })}
        </div>
      </div>

      {/* FAQ Accordion List */}
      <div className="space-y-3">
        {filteredFaqs.length === 0 ? (
          <div className="bg-white border border-[#eaeaea] p-12 rounded-sm text-center">
            <Info size={24} className="mx-auto text-gray-300 mb-2" />
            <p className="text-xs font-semibold text-gray-600">
              {language === 'es' ? 'No se encontraron resultados' : 'No results found'}
            </p>
            <p className="text-[10px] text-gray-400 mt-1">
              {language === 'es' ? 'Intente cambiar el filtro de categoría o reescribir su búsqueda.' : 'Try changing your category filter or rewriting your search.'}
            </p>
          </div>
        ) : (
          filteredFaqs.map((faq) => {
            const isExpanded = expandedId === faq.id;
            const QuestionIcon = faq.icon;
            
            return (
              <div 
                key={faq.id} 
                className={`bg-white border rounded-sm transition-all duration-200 overflow-hidden ${
                  isExpanded ? 'border-gray-900 shadow-xs' : 'border-[#eaeaea] hover:border-gray-300'
                }`}
              >
                {/* Header Button */}
                <button
                  onClick={() => toggleExpand(faq.id)}
                  className="w-full text-left p-5 flex items-center justify-between gap-4 cursor-pointer focus:outline-none"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`p-1.5 rounded-sm flex-shrink-0 ${isExpanded ? 'bg-black text-white' : 'bg-gray-50 text-gray-500 border border-[#eaeaea]'}`}>
                      <QuestionIcon size={14} />
                    </div>
                    <span className="font-sans font-bold text-xs md:text-sm text-gray-900 leading-snug">
                      {language === 'es' ? faq.questionEs : faq.questionEn}
                    </span>
                  </div>
                  <ChevronDown 
                    size={16} 
                    className={`text-gray-400 transition-transform duration-300 flex-shrink-0 ${isExpanded ? 'rotate-180 text-black' : ''}`} 
                  />
                </button>

                {/* Content Area with smooth height animation */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                    >
                      <div className="px-5 pb-6 pt-1 border-t border-[#fafafa]">
                        <div className="prose prose-sm max-w-none text-gray-700">
                          {language === 'es' ? faq.answerEs : faq.answerEn}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>

      {/* Physical Note / Disclaimer info block */}
      <div className="bg-gray-50 border border-[#eaeaea] rounded-sm p-5 text-left flex gap-4">
        <ShieldCheck className="text-gray-400 flex-shrink-0 mt-0.5" size={18} />
        <div>
          <h4 className="font-sans font-bold text-xs text-gray-900">
            {language === 'es' ? 'Certificación de Encriptación y No-Repudio' : 'Encryption & Non-Repudiation Certification'}
          </h4>
          <p className="text-[11px] text-gray-500 leading-relaxed mt-1">
            {language === 'es' 
              ? 'Todas las operaciones de viewQ son auditables bit por bit. El uso del algoritmo ML-KEM-768 cumple con las directrices más recientes del NIST y el estándar FIPS 203. Las marcas de tiempo de Stellar garantizan la existencia del archivo en la fecha exacta sin requerir de un Tercero de Confianza centralizado vulnerable, protegiendo así la cadena de custodia contra ataques retrospectivos y el no-repudio absoluto de las partes involucradas.'
              : 'All viewQ operations are bit-by-bit auditable. The ML-KEM-768 implementation aligns with NIST guidelines and the FIPS 203 standard. Stellar blockchain timestamps prove the evidence existence at the exact date without relying on a vulnerable central third-party, thereby protecting the chain of custody against retro-active tampering and supporting complete non-repudiation.'}
          </p>
        </div>
      </div>
    </div>
  );
};
