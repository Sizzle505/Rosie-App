# Captain arcade controller support
Use a standard-mapped Xbox, PlayStation, or compatible Bluetooth/USB controller. Pair it with the OS; click/tap the desired cabinet once if needed, then press a controller button and release it to arm controls. Only the focused/selected visible cabinet receives inputs. Disconnecting, changing focus, or hiding the document clears controller holds. On mouse-first desktops, redundant virtual steering is hidden while a controller is connected; touch-first devices retain touch controls.

| Game | Steering | Action | Pause / retry | Menus |
| --- | --- | --- | --- | --- |
| Yacht Dash | left stick or D-pad left/right | A (Cross) / RT boost | Start/Options pause; X/Square opens restart confirmation, A confirms, B cancels | direction selects level, A starts; A next level, X replay, B return, Y victory art |
| Ember Tunnel Drill | left stick or D-pad up/down | A/Cross or RT turbo | Start/Options pause; X/Square opens pause, X again retries; B from pause returns to level menu | direction selects world, A launches or advances; Y opening film; A plays/continues, B skips |
| Cosmic Odyssey | left stick or D-pad moves; right stick aims | RT/R2 or RB/R1 laser; LT/L2 or LB/L1 rocket; A/Cross or Y/Triangle boost | Start/Options pause; X/Square opens pause, X again retries | direction selects sector or victory art; A launches/continues; card dialog A flips, B closes, left/right cycles, Start launches |

Browser support for Gamepad API and standard mapping varies. Native fullscreen and autoplay require a trusted browser gesture; controller-driven launch uses existing fallback fullscreen where supported. Do not assume Tesla browser support. Test desktop Chromium, Safari/iPhone, and Tesla with the actual paired hardware. Nonstandard mappings and controller-based navigation outside the three game cabinets are not included. Run npm run test:gamepad.
