use strict;
use warnings;
use IO::Socket::INET;
$| = 1;

my $port = $ARGV[0] || 8000;
my $doc_root = $ARGV[1] || '.';

my $server = IO::Socket::INET->new(
    LocalPort => $port,
    Type      => SOCK_STREAM,
    Reuse     => 1,
    Listen    => 10,
    Proto     => 'tcp'
) or die "No se puede iniciar servidor en puerto $port: $!\n";

binmode STDOUT;
print "Servidor corriendo en http://localhost:$port\n";
print "Directorio raiz: $doc_root\n";
print "Presiona Ctrl+C para detener\n";

my $mime_types = {
    '.html' => 'text/html; charset=utf-8',
    '.css'  => 'text/css; charset=utf-8',
    '.js'   => 'application/javascript; charset=utf-8',
    '.json' => 'application/json; charset=utf-8',
    '.png'  => 'image/png',
    '.jpg'  => 'image/jpeg',
    '.jpeg' => 'image/jpeg',
    '.gif'  => 'image/gif',
    '.svg'  => 'image/svg+xml',
    '.ico'  => 'image/x-icon',
    '.txt'  => 'text/plain; charset=utf-8',
    '.webp' => 'image/webp',
};

while (my $client = $server->accept()) {
    $client->autoflush(1);
    my $request = <$client>;
    next unless $request;
    $request =~ /^(\w+)\s+(\S+)/;
    my ($method, $path) = ($1, $2);
    
    $path = '/index.html' if $path eq '/';
    $path =~ s/\?.*//;
    $path =~ s/%([0-9A-Fa-f]{2})/chr(hex($1))/eg;
    
    my $file = $doc_root . $path;
    $file =~ s|/+|/|g;
    
    my ($ext) = $file =~ /(\.[^.]+)$/;
    my $mime = $mime_types->{$ext} || 'application/octet-stream';
    
    if (-e $file && !-d _) {
        open(my $fh, '<:raw', $file) or do {
            print $client "HTTP/1.1 500\r\nContent-Length: 0\r\n\r\n";
            close($client);
            next;
        };
        my $data = do { local $/; <$fh> };
        close($fh);
        my $len = length $data;
        print $client "HTTP/1.1 200 OK\r\n";
        print $client "Content-Type: $mime\r\n";
        print $client "Content-Length: $len\r\n";
        print $client "Access-Control-Allow-Origin: *\r\n";
        print $client "Connection: close\r\n\r\n";
        print $client $data;
    } else {
        print $client "HTTP/1.1 404 Not Found\r\n";
        print $client "Content-Type: text/plain\r\n";
        print $client "Content-Length: 13\r\n";
        print $client "Connection: close\r\n\r\n";
        print $client "404 Not Found\n";
    }
    close($client);
}

close($server);
