import {
  Component,
  EventEmitter,
  Output,
  signal,
  ViewChild,
  ElementRef,
  Input,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../../core/services/toast.service';

export interface ChatDraft {
  tipo: 'TEXTO' | 'IMAGEN' | 'AUDIO' | 'OFERTA_PRECIO' | 'GIF';
  texto?: string;
  archivo?: File | Blob;
  duracionSegundos?: number;
  precioPropuesto?: number;
}

@Component({
  selector: 'app-chat-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-input.html',
  styleUrl: './chat-input.css',
})
export class ChatInputComponent {
  @Input() esDirecto = false;
  @Input() puedeNegociar = true;
  @Output() enviarMensaje = new EventEmitter<ChatDraft>();
  @Output() escribiendo = new EventEmitter<void>();
  @Output() abrirNegociacion = new EventEmitter<void>();

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('textArea') textArea!: ElementRef<HTMLTextAreaElement>;

  private http = inject(HttpClient);
  private toast = inject(ToastService);

  texto = signal('');
  isRecording = signal(false);
  recordingSeconds = signal(0);
  private recordingInterval: any;

  // Gifs
  mostrarGifs = signal(false);
  mostrarEmojis = signal(false);
  gifSearch = signal('');
  emojiSearch = signal('');
  gifs = signal<any[]>([]);
  private tenorKey = 'LIVDSRZULELA'; 

  allEmojis = [
    // SMILIES
    { c: '😀', t: 'grinning face happy smile' }, { c: '😃', t: 'smiley happy smile' }, { c: '😄', t: 'smile happy joy' },
    { c: '😁', t: 'grin happy smile' }, { c: '😆', t: 'laugh happy smile' }, { c: '😅', t: 'sweat smile happy' },
    { c: '🤣', t: 'rofl laugh floor' }, { c: '😂', t: 'joy laugh cry' }, { c: '🙂', t: 'slight smile' },
    { c: '🙃', t: 'upside down' }, { c: '😉', t: 'wink' }, { c: '😊', t: 'blush happy' },
    { c: '😇', t: 'innocent angel' }, { c: '🥰', t: 'hearts love adore' }, { c: '😍', t: 'heart eyes love' },
    { c: '🤩', t: 'star struck wow' }, { c: '😘', t: 'kissing heart love' }, { c: '😗', t: 'kiss' },
    { c: '😋', t: 'yum delicious food' }, { c: '😛', t: 'tongue' }, { c: '😜', t: 'wink tongue' },
    { c: '🤪', t: 'zany crazy' }, { c: '😝', t: 'squint tongue' }, { c: '🤑', t: 'money mouth rich' },
    { c: '🤗', t: 'hugs' }, { c: '🤭', t: 'hand mouth' }, { c: '🤫', t: 'shushing quiet' },
    { c: '🤔', t: 'thinking' }, { c: '🤐', t: 'zipper mouth' }, { c: '🤨', t: 'raised eyebrow' },
    { c: '😐', t: 'neutral' }, { c: '😑', t: 'expressionless' }, { c: '😶', t: 'no mouth' },
    { c: '😏', t: 'smirk' }, { c: '😒', t: 'unamused' }, { c: '🙄', t: 'roll eyes' },
    { c: '😬', t: 'grimace' }, { c: '🤥', t: 'lying liar' }, { c: '😌', t: 'relieved' },
    { c: '😔', t: 'pensive sad' }, { c: '😪', t: 'sleepy' }, { c: '🤤', t: 'drooling' },
    { c: '😴', t: 'sleeping zzz' }, { c: '😷', t: 'mask sick' }, { c: '🤒', t: 'thermometer sick' },
    { c: '🤕', t: 'bandage sick' }, { c: '🤢', t: 'nauseated sick' }, { c: '🤮', t: 'vomiting sick' },
    { c: '🥵', t: 'hot heat' }, { c: '🥶', t: 'cold ice' }, { c: '🥴', t: 'woozy' },
    { c: '😵', t: 'dizzy' }, { c: '🤯', t: 'exploding head wow' }, { c: '🤠', t: 'cowboy' },
    { c: '🥳', t: 'partying celebrate' }, { c: '😎', t: 'sunglasses cool' }, { c: '🤓', t: 'nerd' },
    { c: '🧐', t: 'monocle' }, { c: '😕', t: 'confused' }, { c: '😟', t: 'worried' },
    { c: '🙁', t: 'slight frown' }, { c: '☹️', t: 'frown' }, { c: '😮', t: 'open mouth' },
    { c: '😯', t: 'hushed' }, { c: '😲', t: 'astonished' }, { c: '😳', t: 'flushed' },
    { c: '🥺', t: 'pleading eyes' }, { c: '😦', t: 'frowning open' }, { c: '😧', t: 'anguished' },
    { c: '😨', t: 'fearful' }, { c: '😰', t: 'cold sweat' }, { c: '😥', t: 'sad sweat' },
    { c: '😢', t: 'crying cry' }, { c: '😭', t: 'sob cry' }, { c: '😱', t: 'scream fear' },
    { c: '😖', t: 'confounded' }, { c: '😣', t: 'persevering' }, { c: '😞', t: 'disappointed' },
    { c: '😓', t: 'sweat' }, { c: '😩', t: 'weary' }, { c: '😫', t: 'tired' },
    { c: '🥱', t: 'yawning' }, { c: '😤', t: 'triumph steam' }, { c: '😡', t: 'pouting angry' },
    { c: '😠', t: 'angry' }, { c: '🤬', t: 'cursing swear' }, { c: '😈', t: 'devil' },
    { c: '👿', t: 'imp' }, { c: '💀', t: 'skull' }, { c: '💩', t: 'poop' },
    { c: '🤡', t: 'clown' }, { c: '👹', t: 'ogre' }, { c: '👺', t: 'goblin' },
    { c: '👻', t: 'ghost' }, { c: '👽', t: 'alien' }, { c: '👾', t: 'alien monster' },
    { c: '🤖', t: 'robot' },

    // GESTOS
    { c: '👋', t: 'wave hello hi' }, { c: '🤚', t: 'raised back' }, { c: '🖐️', t: 'hand fingers' },
    { c: '✋', t: 'raised hand' }, { c: '🖖', t: 'vulcan' }, { c: '👌', t: 'ok' },
    { c: '🤏', t: 'pinching' }, { c: '✌️', t: 'v sign peace' }, { c: '🤞', t: 'crossed fingers' },
    { c: '🤟', t: 'love you' }, { c: '🤘', t: 'rock metal' }, { c: '🤙', t: 'call me' },
    { c: '👈', t: 'point left' }, { c: '👉', t: 'point right' }, { c: '👆', t: 'point up' },
    { c: '🖕', t: 'middle finger' }, { c: '👇', t: 'point down' }, { c: '☝️', t: 'point up index' },
    { c: '👍', t: 'thumbs up like ok' }, { c: '👎', t: 'thumbs down dislike' }, { c: '✊', t: 'fist raised' },
    { c: '👊', t: 'fist oncoming punch' }, { c: '🤛', t: 'fist left' }, { c: '🤜', t: 'fist right' },
    { c: '👏', t: 'clapping applause' }, { c: '🙌', t: 'hands up' }, { c: '👐', t: 'open hands' },
    { c: '🤲', t: 'palms up' }, { c: '🤝', t: 'handshake deal' }, { c: '🙏', t: 'pray please thanks' },
    { c: '✍️', t: 'writing' }, { c: '💅', t: 'nail polish' }, { c: '🤳', t: 'selfie' },
    { c: '💪', t: 'bicep muscle strong' }, { c: '🦾', t: 'mechanical arm' }, { c: '🦵', t: 'leg' },
    { c: '🦶', t: 'foot' }, { c: '👂', t: 'ear' }, { c: '🦻', t: 'hearing aid' },
    { c: '👃', t: 'nose' }, { c: '🧠', t: 'brain' }, { c: '🦷', t: 'tooth' },
    { c: '🦴', t: 'bone' }, { c: '👀', t: 'eyes' }, { c: '👁️', t: 'eye' },
    { c: '👅', t: 'tongue' }, { c: '👄', t: 'mouth' },

    // CORAZONES
    { c: '❤️', t: 'red heart love' }, { c: '🧡', t: 'orange heart' }, { c: '💛', t: 'yellow heart' },
    { c: '💚', t: 'green heart' }, { c: '💙', t: 'blue heart' }, { c: '💜', t: 'purple heart' },
    { c: '🖤', t: 'black heart' }, { c: '🤍', t: 'white heart' }, { c: '🤎', t: 'brown heart' },
    { c: '💔', t: 'broken heart' }, { c: '❣️', t: 'heart exclamation' }, { c: '💕', t: 'two hearts' },
    { c: '💞', t: 'revolving hearts' }, { c: '💓', t: 'beating heart' }, { c: '💗', t: 'growing heart' },
    { c: '💖', t: 'sparkling heart' }, { c: '💘', t: 'cupid heart bow' }, { c: '💝', t: 'heart gift' },
    { c: '💟', t: 'heart decoration' },

    // ANIMALES Y NATURALEZA
    { c: '🐶', t: 'dog' }, { c: '🐱', t: 'cat' }, { c: '🐭', t: 'mouse' },
    { c: '🐹', t: 'hamster' }, { c: '🐰', t: 'rabbit' }, { c: '🦊', t: 'fox' },
    { c: '🐻', t: 'bear' }, { c: '🐼', t: 'panda' }, { c: '🐨', t: 'koala' },
    { c: '🐯', t: 'tiger' }, { c: '🦁', t: 'lion' }, { c: '🐮', t: 'cow' },
    { c: '🐷', t: 'pig' }, { c: '🐽', t: 'pig nose' }, { c: '🐸', t: 'frog' },
    { c: '🐵', t: 'monkey face' }, { c: '🐒', t: 'monkey' }, { c: '🦍', t: 'gorilla' },
    { c: '🦧', t: 'orangutan' }, { c: '🐶', t: 'dog' }, { c: '🐕', t: 'dog' },
    { c: '🐩', t: 'poodle' }, { c: '🐺', t: 'wolf' }, { c: '🦊', t: 'fox' },
    { c: '🦝', t: 'raccoon' }, { c: '🐱', t: 'cat' }, { c: '🐈', t: 'cat' },
    { c: '🦁', t: 'lion' }, { c: '🐯', t: 'tiger' }, { c: '🐅', t: 'tiger' },
    { c: '🐆', t: 'leopard' }, { c: '🐴', t: 'horse' }, { c: '🐎', t: 'horse' },
    { c: '🦄', t: 'unicorn' }, { c: '🦓', t: 'zebra' }, { c: '🦌', t: 'deer' },
    { c: '🐮', t: 'cow' }, { c: '🐂', t: 'ox' }, { c: '🐃', t: 'water buffalo' },
    { c: '🐄', t: 'cow' }, { c: '🐷', t: 'pig' }, { c: '🐖', t: 'pig' },
    { c: '🐗', t: 'boar' }, { c: '🐽', t: 'pig nose' }, { c: '🐏', t: 'ram' },
    { c: '🐑', t: 'sheep' }, { c: '🐐', t: 'goat' }, { c: '🐪', t: 'camel' },
    { c: '🐫', t: 'camel' }, { c: '🦙', t: 'llama' }, { c: '🦒', t: 'giraffe' },
    { c: '🐘', t: 'elephant' }, { c: '🦏', t: 'rhinoceros' }, { c: '🦛', t: 'hippopotamus' },
    { c: '🐭', t: 'mouse' }, { c: '🐁', t: 'mouse' }, { c: '🐀', t: 'rat' },
    { c: '🐹', t: 'hamster' }, { c: '🐰', t: 'rabbit' }, { c: '🐇', t: 'rabbit' },
    { c: '🐿️', t: 'chipmunk' }, { c: '🦔', t: 'hedgehog' }, { c: '🦇', t: 'bat' },
    { c: '🐻', t: 'bear' }, { c: '🐼', t: 'panda' }, { c: '🦥', t: 'sloth' },
    { c: '🦦', t: 'otter' }, { c: '🦨', t: 'skunk' }, { c: '🦘', t: 'kangaroo' },
    { c: '🦡', t: 'badger' }, { c: '🐾', t: 'paw prints' }, { c: '🦃', t: 'turkey' },
    { c: '🐔', t: 'chicken' }, { c: '🐓', t: 'rooster' }, { c: '🐣', t: 'hatching chick' },
    { c: '🐤', t: 'baby chick' }, { c: '🐥', t: 'baby chick' }, { c: '🐦', t: 'bird' },
    { c: '🐧', t: 'penguin' }, { c: '🕊️', t: 'dove' }, { c: '🦅', t: 'eagle' },
    { c: '🦆', t: 'duck' }, { c: '🦢', t: 'swan' }, { c: '🦉', t: 'owl' },
    { c: '🦩', t: 'flamingo' }, { c: '🦚', t: 'peacock' }, { c: '🦜', t: 'parrot' },
    { c: '🐸', t: 'frog' }, { c: '🐊', t: 'crocodile' }, { c: '🐢', t: 'turtle' },
    { c: '🦎', t: 'lizard' }, { c: '🐍', t: 'snake' }, { c: '🐲', t: 'dragon' },
    { c: '🐉', t: 'dragon' }, { c: '🦕', t: 'sauropod' }, { c: '🦖', t: 't-rex' },
    { c: '🐳', t: 'whale' }, { c: '🐋', t: 'whale' }, { c: '🐬', t: 'dolphin' },
    { c: '🐟', t: 'fish' }, { c: '🐠', t: 'tropical fish' }, { c: '🐡', t: 'blowfish' },
    { c: '🦈', t: 'shark' }, { c: '🐙', t: 'octopus' }, { c: '🐚', t: 'shell' },
    { c: '🐌', t: 'snail' }, { c: '🦋', t: 'butterfly' }, { c: '🐛', t: 'bug' },
    { c: '🐜', t: 'ant' }, { c: '🐝', t: 'honeybee' }, { c: '🐞', t: 'lady beetle' },
    { c: '🦗', t: 'cricket' }, { c: '🕷️', t: 'spider' }, { c: '🕸️', t: 'spider web' },
    { c: '🦂', t: 'scorpion' }, { c: '🦟', t: 'mosquito' }, { c: '🦠', t: 'microbe' },
    { c: '💐', t: 'bouquet' }, { c: '🌸', t: 'cherry blossom' }, { c: '💮', t: 'white flower' },
    { c: '🏵️', t: 'rosette' }, { c: '🌹', t: 'rose' }, { c: '🥀', t: 'wilted flower' },
    { c: '🌺', t: 'hibiscus' }, { c: '🌻', t: 'sunflower' }, { c: '🌼', t: 'blossom' },
    { c: '🌷', t: 'tulip' }, { c: '🌱', t: 'seedling' }, { c: '🌲', t: 'evergreen tree' },
    { c: '🌳', t: 'deciduous tree' }, { c: '🌴', t: 'palm tree' }, { c: '🌵', t: 'cactus' },
    { c: '🌾', t: 'sheaf of rice' }, { c: '🌿', t: 'herb' }, { c: '☘️', t: 'shamrock' },
    { c: '🍀', t: 'four leaf clover' }, { c: '🍁', t: 'maple leaf' }, { c: '🍂', t: 'fallen leaf' },
    { c: '🍃', t: 'leaf fluttering' },

    // COMIDA Y BEBIDA
    { c: '🍏', t: 'green apple' }, { c: '🍎', t: 'red apple' }, { c: '🍐', t: 'pear' },
    { c: '🍊', t: 'tangerine orange' }, { c: '🍋', t: 'lemon' }, { c: '🍌', t: 'banana' },
    { c: '🍉', t: 'watermelon' }, { c: '🍇', t: 'grapes' }, { c: '🍓', t: 'strawberry' },
    { c: '🍈', t: 'melon' }, { c: '🍒', t: 'cherries' }, { c: '🍑', t: 'peach' },
    { c: '🥭', t: 'mango' }, { c: '🍍', t: 'pineapple' }, { c: '🥥', t: 'coconut' },
    { c: '🥝', t: 'kiwi' }, { c: '🍅', t: 'tomato' }, { c: '🍆', t: 'eggplant aubergine' },
    { c: '🥑', t: 'avocado' }, { c: '🥦', t: 'broccoli' }, { c: '🥬', t: 'leafy green' },
    { c: '🥒', t: 'cucumber' }, { c: '🌶️', t: 'hot pepper' }, { c: '🌽', t: 'ear of corn' },
    { c: '🥕', t: 'carrot' }, { c: '🧄', t: 'garlic' }, { c: '🧅', t: 'onion' },
    { c: '🥔', t: 'potato' }, { c: '🍠', t: 'roasted sweet potato' }, { c: '🥐', t: 'croissant' },
    { c: '🥯', t: 'bagel' }, { c: '🍞', t: 'bread' }, { c: '🥖', t: 'baguette bread' },
    { c: '🥨', t: 'pretzel' }, { c: '🧀', t: 'cheese' }, { c: '🥚', t: 'egg' },
    { c: '🍳', t: 'cooking' }, { c: '🧈', t: 'butter' }, { c: '🥞', t: 'pancakes' },
    { c: '🥓', t: 'bacon' }, { c: '🥩', t: 'cut of meat' }, { c: '🍗', t: 'poultry leg' },
    { c: '🍖', t: 'meat on bone' }, { c: '🦴', t: 'bone' }, { c: '🌭', t: 'hot dog' },
    { c: '🍔', t: 'hamburger' }, { c: '🍟', t: 'french fries' }, { c: '🍕', t: 'pizza' },
    { c: '🥪', t: 'sandwich' }, { c: '🥙', t: 'stuffed flatbread' }, { c: '🧆', t: 'falafel' },
    { c: '🌮', t: 'taco' }, { c: '🌯', t: 'burrito' }, { c: '🥗', t: 'green salad' },
    { c: '🥘', t: 'shallow pan of food' }, { c: '🍝', t: 'spaghetti' }, { c: '🍜', t: 'steaming bowl' },
    { c: '🍲', t: 'pot of food' }, { c: '🍛', t: 'curry rice' }, { c: '🍣', t: 'sushi' },
    { c: '🍱', t: 'bento box' }, { c: '🥟', t: 'dumpling' }, { c: '🍤', t: 'fried shrimp' },
    { c: '🍙', t: 'rice ball' }, { c: '🍚', t: 'cooked rice' }, { c: '🍘', t: 'rice cracker' },
    { c: '🍥', t: 'fish cake' }, { c: '🥠', t: 'fortune cookie' }, { c: '🍢', t: 'oden' },
    { c: '🍡', t: 'dango' }, { c: '🍧', t: 'shaved ice' }, { c: '🍨', t: 'ice cream' },
    { c: '🍦', t: 'soft serve' }, { c: '🥧', t: 'pie' }, { c: '🍰', t: 'shortcake' },
    { c: '🎂', t: 'birthday cake' }, { c: '🍮', t: 'custard' }, { c: '🍭', t: 'lollipop' },
    { c: '🍬', t: 'candy' }, { c: '🍫', t: 'chocolate bar' }, { c: '🍿', t: 'popcorn' },
    { c: '🍩', t: 'doughnut' }, { c: '🍪', t: 'cookie' }, { c: '🌰', t: 'chestnut' },
    { c: '🥜', t: 'peanuts' }, { c: '🍯', t: 'honey pot' }, { c: '🥛', t: 'glass of milk' },
    { c: '☕', t: 'hot beverage' }, { c: '🍵', t: 'teacup without handle' }, { c: '🍶', t: 'sake' },
    { c: '🍷', t: 'wine glass' }, { c: '🍸', t: 'cocktail glass' }, { c: '🍹', t: 'tropical drink' },
    { c: '🍺', t: 'beer mug' }, { c: '🍻', t: 'clinking beer mugs' }, { c: '🥂', t: 'clinking glasses' },
    { c: '🥃', t: 'tumbler glass' }, { c: '🥤', t: 'cup with straw' }, { c: '🧃', t: 'beverage box' },
    { c: '🧉', t: 'mate' }, { c: '🧊', t: 'ice' }, { c: '🥢', t: 'chopsticks' },

    // ACTIVIDADES Y DEPORTES
    { c: '⚽', t: 'soccer ball' }, { c: '🏀', t: 'basketball' }, { c: '🏈', t: 'american football' },
    { c: '⚾', t: 'baseball' }, { c: '🥎', t: 'softball' }, { c: '🎾', t: 'tennis' },
    { c: '🏐', t: 'volleyball' }, { c: '🏉', t: 'rugby football' }, { c: '🎱', t: 'pool 8 ball' },
    { c: '🪀', t: 'yo-yo' }, { c: '🏓', t: 'ping pong' }, { c: '🏸', t: 'badminton' },
    { c: '🏒', t: 'ice hockey' }, { c: '🏑', t: 'field hockey' }, { c: '🥍', t: 'lacrosse' },
    { c: '🏏', t: 'cricket game' }, { c: '🥅', t: 'goal net' }, { c: '⛳', t: 'flag in hole' },
    { c: '🪁', t: 'kite' }, { c: '🏹', t: 'bow and arrow' }, { c: '🎣', t: 'fishing pole' },
    { c: '🤿', t: 'diving mask' }, { c: '🥊', t: 'boxing glove' }, { c: '🥋', t: 'martial arts uniform' },
    { c: '🎽', t: 'running shirt' }, { c: '🛹', t: 'skateboard' }, { c: '🛼', t: 'roller skate' },
    { c: '🛷', t: 'sled' }, { c: '⛸️', t: 'ice skate' }, { c: '🎿', t: 'skis' },

    // VIAJES Y LUGARES (Incluye Motor)
    { c: '🚗', t: 'automobile car' }, { c: '🚕', t: 'taxi' }, { c: '🚙', t: 'suv' },
    { c: '🚌', t: 'bus' }, { c: '🚎', t: 'trolleybus' }, { c: '🏎️', t: 'racing car' },
    { c: '🚓', t: 'police car' }, { c: '🚑', t: 'ambulance' }, { c: '🚒', t: 'fire engine' },
    { c: '🚐', t: 'minibus' }, { c: '🚚', t: 'delivery truck' }, { c: '🚛', t: 'articulated lorry' },
    { c: '🚜', t: 'tractor' }, { c: '🛵', t: 'motor scooter' }, { c: '🏍️', t: 'motorcycle' },
    { c: '🚲', t: 'bicycle' }, { c: '🛴', t: 'kick scooter' }, { c: '🚏', t: 'bus stop' },
    { c: '🛤️', t: 'railway track' }, { c: '⛽', t: 'fuel pump' }, { c: '🚨', t: 'police light' },
    { c: '🚥', t: 'horizontal traffic light' }, { c: '🚦', t: 'vertical traffic light' },
    { c: '🛑', t: 'stop sign' }, { c: '🚧', t: 'construction' }, { c: '⚓', t: 'anchor' },
    { c: '⛵', t: 'sailboat' }, { c: '🛶', t: 'canoe' }, { c: '🚤', t: 'speedboat' },
    { c: '🛳️', t: 'passenger ship' }, { c: '⛴️', t: 'ferry' }, { c: '🛥️', t: 'motor boat' },
    { c: '🚢', t: 'ship' }, { c: '✈️', t: 'airplane' }, { c: '🛩️', t: 'small airplane' },
    { c: '🛫', t: 'airplane departure' }, { c: '🛬', t: 'airplane arrival' }, { c: '🪂', t: 'parachute' },
    { c: '💺', t: 'seat' }, { c: '🚁', t: 'helicopter' }, { c: '🚟', t: 'suspension railway' },
    { c: '🚠', t: 'mountain cableway' }, { c: '🚡', t: 'aerial tramway' }, { c: '🛰️', t: 'satellite' },
    { c: '🚀', t: 'rocket' }, { c: '🛸', t: 'flying saucer' },

    // OBJETOS Y NEGOCIOS
    { c: '⌚', t: 'watch' }, { c: '📱', t: 'mobile phone' }, { c: '📲', t: 'mobile phone arrow' },
    { c: '💻', t: 'laptop' }, { c: '⌨️', t: 'keyboard' }, { c: '🖱️', t: 'computer mouse' },
    { c: '🖲️', t: 'trackball' }, { c: '🕹️', t: 'joystick' }, { c: '🗜️', t: 'clamp' },
    { c: '💽', t: 'computer disk' }, { c: '💾', t: 'floppy disk' }, { c: '💿', t: 'optical disk' },
    { c: '📀', t: 'dvd' }, { c: '📼', t: 'videocassette' }, { c: '📷', t: 'camera' },
    { c: '📸', t: 'camera with flash' }, { c: '📹', t: 'video camera' }, { c: '🎥', t: 'movie camera' },
    { c: '📽️', t: 'film projector' }, { c: '🎞️', t: 'film frames' }, { c: '📞', t: 'telephone receiver' },
    { c: '☎️', t: 'telephone' }, { c: '📟', t: 'pager' }, { c: '📠', t: 'fax machine' },
    { c: '📺', t: 'television' }, { c: '📻', t: 'radio' }, { c: '🎙️', t: 'studio microphone' },
    { c: '🎚️', t: 'level slider' }, { c: '🎛️', t: 'control knobs' }, { c: '🧭', t: 'compass' },
    { c: '⏱️', t: 'stopwatch' }, { c: '⏲️', t: 'timer clock' }, { c: '⏰', t: 'alarm clock' },
    { c: '🕰️', t: 'mantelpiece clock' }, { c: '⌛', t: 'hourglass done' }, { c: '⏳', t: 'hourglass not done' },
    { c: '📡', t: 'satellite antenna' }, { c: '🔋', t: 'battery' }, { c: '🔌', t: 'electric plug' },
    { c: '💡', t: 'light bulb' }, { c: '🔦', t: 'flashlight' }, { c: '🕯️', t: 'candle' },
    { c: '🪔', t: 'diya lamp' }, { c: '🧯', t: 'fire extinguisher' }, { c: '🗑️', t: 'wastebasket' },
    { c: '🛢️', t: 'oil drum' }, { c: '💸', t: 'money with wings' }, { c: '💵', t: 'dollar banknote' },
    { c: '💴', t: 'yen banknote' }, { c: '💶', t: 'euro banknote' }, { c: '💷', t: 'pound banknote' },
    { c: '💰', t: 'money bag' }, { c: '💳', t: 'credit card' }, { c: '💎', t: 'gem stone' },
    { c: '⚖️', t: 'balance scale' }, { c: '🧰', t: 'toolbox' }, { c: '🔧', t: 'wrench' },
    { c: '🔨', t: 'hammer' }, { c: '⚒️', t: 'hammer and pick' }, { c: '🛠️', t: 'hammer and wrench' },
    { c: '⛏️', t: 'pick' }, { c: '🔩', t: 'nut and bolt' }, { c: '⚙️', t: 'gear' },
    { c: '⛓️', t: 'chains' }, { c: '🧱', t: 'brick' }, { c: '🔫', t: 'pistol' },
    { c: '💣', t: 'bomb' }, { c: '🔪', t: 'kitchen knife' }, { c: '🗡️', t: 'dagger' },
    { c: '⚔️', t: 'crossed swords' }, { c: '🛡️', t: 'shield' }, { c: '🚬', t: 'smoking' },
    { c: '⚰️', t: 'coffin' }, { c: '⚱️', t: 'funeral urn' }, { c: '🏺', t: 'amphora' },
    { c: '🔮', t: 'crystal ball' }, { c: '📿', t: 'prayer beads' }, { c: '🧿', t: 'nazar amulet' },
    { c: '💈', t: 'barber pole' }, { c: '⚗️', t: 'alembic' }, { c: '🔭', t: 'telescope' },
    { c: '🔬', t: 'microscope' }, { c: '🕳️', t: 'hole' }, { c: '🩹', t: 'adhesive bandage' },
    { c: '🩺', t: 'stethoscope' }, { c: '💊', t: 'pill' }, { c: '💉', t: 'syringe' },
    { c: '🩸', t: 'drop of blood' }, { c: '🏷️', t: 'label' }, { c: '🔖', t: 'bookmark' },
    { c: '🚽', t: 'toilet' }, { c: '🚿', t: 'shower' }, { c: '🛀', t: 'bathtub' },
    { c: '🔑', t: 'key' }, { c: '🗝️', t: 'old key' }, { c: '🛋️', t: 'couch and lamp' },
    { c: '🪑', t: 'chair' }, { c: '🛌', t: 'person in bed' }, { c: '🛏️', t: 'bed' },
    { c: '🖼️', t: 'framed picture' }, { c: '🛍️', t: 'shopping bags' }, { c: '🛒', t: 'shopping cart' },

    // BANDERAS
    { c: '🇪🇸', t: 'spain flag' }, { c: '🇺🇸', t: 'usa flag' }, { c: '🇫🇷', t: 'france flag' },
    { c: '🇩🇪', t: 'germany flag' }, { c: '🇮🇹', t: 'italy flag' }, { c: '🇬🇧', t: 'uk flag' },
    { c: '🇯🇵', t: 'japan flag' }, { c: '🇰🇷', t: 'korea flag' }, { c: '🇨🇳', t: 'china flag' },
    { c: '🇷🇺', t: 'russia flag' }, { c: '🇧🇷', t: 'brazil flag' }, { c: '🇲🇽', t: 'mexico flag' },
    { c: '🇦🇷', t: 'argentina flag' }, { c: '🇨🇴', t: 'colombia flag' }, { c: '🇨🇱', t: 'chile flag' }
  ];

  filteredEmojis = () => {
    const q = this.emojiSearch().toLowerCase().trim();
    if (!q) return this.allEmojis;
    return this.allEmojis.filter(e => e.t.includes(q));
  };

  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private audioStartTime = 0;
  private typingTimeout: any;

  // Tamaño máximo de imagen antes de comprimir (800px de lado)
  private readonly MAX_IMAGE_SIZE = 800;
  private readonly MAX_IMAGE_BYTES = 500_000; // 500KB

  onInput() {
    this.autoResize();

    // Throttle evento escribiendo cada 1.5s
    if (!this.typingTimeout) {
      this.escribiendo.emit();
      this.typingTimeout = setTimeout(() => {
        this.typingTimeout = null;
      }, 1500);
    }
  }

  autoResize() {
    const el = this.textArea?.nativeElement;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = (el.scrollHeight < 120 ? el.scrollHeight : 120) + 'px';
  }

  enviarTexto() {
    const msg = this.texto().trim();
    if (!msg) return;

    this.enviarMensaje.emit({ tipo: 'TEXTO', texto: msg });
    this.texto.set('');
    this.mostrarGifs.set(false);
    this.mostrarEmojis.set(false);
    if (this.textArea?.nativeElement) {
      this.textArea.nativeElement.style.height = 'auto';
    }
  }

  // --- GIFS (Tenor API) ---
  toggleGifs() {
    this.mostrarGifs.set(!this.mostrarGifs());
    if (this.mostrarGifs()) {
      this.mostrarEmojis.set(false);
      if (this.gifs().length === 0) this.buscarGifs();
    }
  }

  buscarGifs() {
    const q = this.gifSearch().trim() || 'trending';
    const limit = 20;
    const url = `https://g.tenor.com/v1/search?q=${q}&key=${this.tenorKey}&limit=${limit}&media_filter=minimal`;

    this.http.get<any>(url).subscribe({
      next: (res) => {
        this.gifs.set(res.results || []);
      },
      error: (err) => console.error('Error fetching GIFs', err),
    });
  }

  seleccionarGif(gif: any) {
    const url = gif.media[0]?.gif?.url || gif.media[0]?.tinygif?.url;
    if (!url) return;
    this.enviarMensaje.emit({ tipo: 'GIF', texto: url }); // We pass the URL in 'texto' prop, ChatPanel will map to mediaUrl
    this.mostrarGifs.set(false);
  }

  // --- EMOJIS ---
  toggleEmojis() {
    this.mostrarEmojis.set(!this.mostrarEmojis());
    this.emojiSearch.set('');
    if (this.mostrarEmojis()) this.mostrarGifs.set(false);
  }

  agregarEmoji(emoji: string) {
    this.texto.set(this.texto() + emoji);
    this.autoResize();
  }

  // --- OFERTAS ---
  toggleOfertaModal() {
    this.abrirNegociacion.emit();
  }

  abrirSelectorImagen() {
    this.fileInput.nativeElement.click();
  }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (file.type.startsWith('image/')) {
        try {
          // Comprimir imagen antes de enviar
          const compressedBlob = await this.compressImage(file);
          const compressedFile = new File([compressedBlob], file.name, { type: 'image/jpeg' });
          this.enviarMensaje.emit({
            tipo: 'IMAGEN',
            archivo: compressedFile,
            texto: this.texto().trim(),
          });
          this.texto.set('');
        } catch {
          // Si falla la compresión, enviar original
          this.enviarMensaje.emit({ tipo: 'IMAGEN', archivo: file, texto: this.texto().trim() });
          this.texto.set('');
        }
        input.value = '';
      }
    }
  }

  /**
   * Comprimir imagen usando Canvas API.
   * Redimensiona a MAX_IMAGE_SIZE y reduce calidad JPEG.
   */
  private compressImage(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = (e) => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;

          // Redimensionar si es más grande que el máximo
          if (width > this.MAX_IMAGE_SIZE || height > this.MAX_IMAGE_SIZE) {
            if (width > height) {
              height = Math.round((height / width) * this.MAX_IMAGE_SIZE);
              width = this.MAX_IMAGE_SIZE;
            } else {
              width = Math.round((width / height) * this.MAX_IMAGE_SIZE);
              height = this.MAX_IMAGE_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0, width, height);

          // Probar con calidad progresivamente más baja
          let quality = 0.7;
          const tryCompress = () => {
            canvas.toBlob(
              (blob) => {
                if (!blob) return reject(new Error('No se pudo comprimir'));
                if (blob.size > this.MAX_IMAGE_BYTES && quality > 0.3) {
                  quality -= 0.1;
                  tryCompress();
                } else {
                  resolve(blob);
                }
              },
              'image/jpeg',
              quality,
            );
          };
          tryCompress();
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  }

  // --- GRABACIÓN DE AUDIO ---
  async iniciarGrabacion() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];
      this.audioStartTime = Date.now();

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.audioChunks.push(e.data);
      };

      this.mediaRecorder.onstop = () => {
        const duracion = Math.floor((Date.now() - this.audioStartTime) / 1000);
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });

        // Detener micrófono
        stream.getTracks().forEach((track) => track.stop());

        if (duracion >= 1 && duracion <= 60) {
          this.enviarMensaje.emit({
            tipo: 'AUDIO',
            archivo: audioBlob,
            duracionSegundos: duracion,
          });
        }
      };

      this.mediaRecorder.start();
      this.isRecording.set(true);
      this.recordingSeconds.set(0);
      this.recordingInterval = setInterval(() => {
        this.recordingSeconds.update(s => s + 1);
        if (this.recordingSeconds() >= 60) this.detenerGrabacion();
      }, 1000);
    } catch (err) {
      console.error('Error accediendo al micrófono:', err);
      this.toast.error('No se pudo acceder al micrófono. Asegúrate de dar permiso.');
    }
  }

  detenerGrabacion() {
    if (this.mediaRecorder && this.isRecording()) {
      this.mediaRecorder.stop();
      this.isRecording.set(false);
      if (this.recordingInterval) {
        clearInterval(this.recordingInterval);
        this.recordingInterval = null;
      }
    }
  }
}
