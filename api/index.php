<?php 

/**
 *
 * GET
 * /api/v1/image/:id
 * 		url = http://upload.wikimedia.org/wikipedia/commons/0/0c/Scarlett_Johansson_Césars_2014.jpg
 * 		
 * 		cache = true
 * 		
 * 		width = 640
 * 		height = 240
 * 			~or~
 * 		crop = L,T,W,H [0-1]
 *   	
 * POST
 * /api/v1/image
 * 		image = [image data]
 * 		cache = true
 * 		adjustments = [adjustment data]
 * 		
 * 
 */

	// define constants
	define('GET', 'GET');
	define('POST', 'POST');
	define('PUT', 'PUT');
	define('DELETE', 'DELETE');

	define('IMAGE', 'image');
	define('BIN_PATH', '/usr/local/bin');

	$dir = getcwd();
	$request = $_SERVER['REQUEST_METHOD'];
	
	$path = isset($_GET['page']) ? $_GET['page'] : null;
	$path = explode('/', $path);
	$path = array_map(function($part) { return strtolower($part); }, $path);
	if(end($path) == '/') $path = array_pop($path);
	$pathLength = count($path);

	$apiVersion = $path[0];
	if($apiVersion != 'v1') throw new Exception('Invalid API version');

	if($pathLength < 2) throw new Exception('No command provided');
	$command = $path[1];

	switch ($command) {
		case IMAGE:

			switch ($request) {
				case GET:

					$id = null;
					$url = isset($_GET['url']) ? $_GET['url'] : null;
					if($pathLength < 3) {
						if(!$url) throw new Exception('No URL or image id provided');
					}else{
						$id = $path[2];
					}

					if($id) {

					}else{

						/**
						 * Check database for cached version here
						 */
						
						$cached = true;
						$ext = getExt($url);
						$file = null;
						$fileHeaders = get_headers($url);
						$eTag = '';
						if(!empty($fileHeaders[23])) {
							$eTag = $fileHeaders[23];
							$eTag = str_replace('Etag: ', '', $eTag);
						}else{
							$eTag = md5($url);
						}

						// check if a cached version exists
						$fileUrl = '../cache/downloads/'.$eTag.'.'.$ext;
						if(!file_exists($fileUrl)) {
							$fileUrl = $url;
							$cached = false;
						}

						$filename = 'cache/downloads/'.$eTag;
						$filepath = $filename.'.'.$ext;

						// if not chached download a local copy
						if(!$cached) {
							try {
								$file = file_get_contents($url);
							} catch (Exception $e) {
								throw new Exception('Unable to fetch image from url: '.$url);
							}
							try {
								file_put_contents('../'.$filepath, $file);
							} catch (Exception $e) {
								throw new Exception('Unable to save image locally');
							}
						}

						$editSteps = '[{"name":"utility","steps":[]},{"name":"adjustments","steps":[{"key":"hueAdjustment","value":-1,"color":[16,127,220],"range":0.2}]},{"name":"filter","amount":1,"steps":[{"key":"saturation","value":0.1},{"key":"colorMatrix","matrix":[1,0,0,0,0.05,0,1,0,0,0.08,0,0,1,0,0.08,0,0,0,1,0]},{"key":"curves","channels":"rgb","curves":[[0,0],[75,70],[180,185],[255,255]]},{"key":"grain","value":0.1},{"key":"curves","channels":"rgb","curves":[[0,25],[46,54],[121,125],[255,252]]}]}]';
						$editSteps = str_replace('"', '\\"', $editSteps);

						$response = processImage($filepath, $editSteps);
						// echo '<pre>'.$response.'</pre>';

						$procssedUrl = '../'.$filename.'_processed.'.$ext;
						if(!file_exists($procssedUrl)) throw new Exception('Processed file not found -- assuming failed');

						switch( $ext ) {
						    case 'gif': $ctype='image/gif'; break;
						    case 'png': $ctype='image/png'; break;
						    case 'jpeg':
						    case 'jpg': $ctype='image/jpeg'; break;
						    default:
						}

						header('Content-type: ' . $ctype);
						echo file_get_contents($procssedUrl);

					}


					// echo 'IMAGE GET REQUEST';
					break;
				
				default:
					// echo 'IMAGE POST REQUEST';
					break;
			}


			break;
		
		default:
			throw new Exception('Unknown command "'.$command.'"');
			break;
	}

	function getExt($str) {
		/**
		 * To do: proper regex checking for things like ? at end of url and if extension exists at all
		 */
		$slashParts = explode('/', $str);
		$filename = end($slashParts);
		$extParts = explode('.', $filename); 
		$ext = end($extParts);
		return $ext;
	}

	function processImage($path, $steps) {
		$dir = getcwd();
		$command = BIN_PATH.'/babel-node '.$dir.'/../backend/index.js ';
		$command .= 'input="'.$dir.'/../'.$path.'" ';
		$command .= 'instructions="'.$steps.'" ';
		$command .= ' 2>&1';
		// echo '<pre>'.$command.'</pre>';
		putenv('PATH='.BIN_PATH);
		$output = shell_exec($command);
		return $output;
	}

?>